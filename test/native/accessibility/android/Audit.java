package com.getcortexlabs.mavis.checks;

import android.app.Instrumentation;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.UiAutomation;
import android.content.Intent;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityNodeInfo;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileWriter;
import java.util.HashSet;
import java.util.Set;
import java.io.FileOutputStream;
import android.graphics.Bitmap;

/** Inspect the installed catalog without suspending TalkBack. */
public class Audit extends Instrumentation {
    private UiAutomation automation;
    private final JSONArray samples = new JSONArray();
    private String theme;
    private final Set<String> captured = new HashSet<>();

    @Override public void onCreate(Bundle arguments) { super.onCreate(arguments); start(); }
    private void pause(long ms) { SystemClock.sleep(ms); }
    private void check(boolean result, String message) {
        if (!result) throw new AssertionError(theme + ": " + message);
    }
    private AccessibilityNodeInfo find(AccessibilityNodeInfo node, String label) {
        if (node == null) return null;
        if (label.equals(node.getViewIdResourceName())
                || label.contentEquals(node.getContentDescription() == null ? "" : node.getContentDescription())
                || label.contentEquals(node.getText() == null ? "" : node.getText())) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo found = find(node.getChild(i), label);
            if (found != null) return found;
        }
        return null;
    }
    private AccessibilityNodeInfo find(String label) {
        switch (label) {
            case "theme": label = theme.equals("midnight") ? "Usar tema claro" : "Usar tema escuro"; break;
            case "next": label = "Outra tela"; break;
            case "action-card": label = "Adicionar favorito"; break;
            case "temperature": label = "Temperatura"; break;
            case "partial": label = "Passo final"; break;
            case "details": label = "Ver detalhes"; break;
            case "close-details": label = "Fechar detalhes"; break;
            case "prepare": label = "Preparar sessão"; break;
            case "disabled-button": label = "Botão indisponível"; break;
            case "disabled-card": label = "Cartão indisponível"; break;
            case "disabled-slider": label = "Volume indisponível"; break;
        }
        for (int i = 0; i < 25; i++) {
            AccessibilityNodeInfo node = find(automation.getRootInActiveWindow(), label);
            if (node != null) return node;
            pause(200);
        }
        throw new AssertionError("Missing node: " + label);
    }
    private JSONObject describe(AccessibilityNodeInfo node) throws Exception {
        node.refresh();
        Rect bounds = new Rect(); node.getBoundsInScreen(bounds);
        JSONObject data = new JSONObject().put("text", node.getText())
            .put("description", node.getContentDescription()).put("class", node.getClassName())
            .put("important", node.isImportantForAccessibility()).put("enabled", node.isEnabled()).put("focused", node.isAccessibilityFocused())
            .put("bounds", bounds.toShortString()).put("children", node.getChildCount());
        AccessibilityNodeInfo.RangeInfo range = node.getRangeInfo();
        if (range != null) data.put("min", range.getMin()).put("max", range.getMax())
            .put("value", range.getCurrent()).put("state", node.getStateDescription());
        return data;
    }
    private void capture(String stage, AccessibilityNodeInfo node) throws Exception {
        samples.put(describe(node).put("theme", theme).put("stage", stage));
        if ((stage.equals("theme") || stage.equals("slider-increase") || stage.equals("close-details") || stage.equals("ready"))
                && captured.add(theme + "-" + stage)) {
            Bitmap screenshot = automation.takeScreenshot();
            check(screenshot != null, "screenshot unavailable");
            try (FileOutputStream image = new FileOutputStream(new File(getTargetContext().getFilesDir(), "a11y-" + theme + "-" + stage + ".png"))) {
                screenshot.compress(Bitmap.CompressFormat.PNG, 100, image);
            } finally { screenshot.recycle(); }
        }
        try (FileWriter file = new FileWriter(new File(getTargetContext().getFilesDir(), "accessibility-check.json"))) { file.write(samples.toString(2)); }
    }
    private AccessibilityNodeInfo focus(String label) throws Exception {
        AccessibilityNodeInfo node = find(label);
        node.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SHOW_ON_SCREEN.getId());
        pause(300);
        node.performAction(AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS);
        pause(1800);
        capture(label, node);
        return node;
    }
    private void click(AccessibilityNodeInfo node) {
        check(node.performAction(AccessibilityNodeInfo.ACTION_CLICK), "click rejected"); pause(600);
    }
    private void value(AccessibilityNodeInfo node, double expected) {
        node.refresh();
        check(Math.abs(node.getRangeInfo().getCurrent() - expected) < 0.00001, "slider value " + expected);
    }
    private void runTheme(int index) throws Exception {
        theme = index == 0 ? "mavis" : "midnight";
        focus("Acessibilidade");
        AccessibilityNodeInfo themeButton = focus("theme");
        Rect bounds = new Rect(); themeButton.getBoundsInScreen(bounds);
        float density = getTargetContext().getResources().getDisplayMetrics().density;
        check(bounds.height() / density >= 47.9 && bounds.width() / density >= 47.9, "small button target");
        click(focus("next"));
        focus("Destino da navegação");
        click(focus("Voltar à acessibilidade"));
        AccessibilityNodeInfo current = automation.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY);
        if (current != null) capture("navigation-return", current);
        focus("Texto visível e legível.");
        AccessibilityNodeInfo card = focus("action-card");
        JSONArray children = new JSONArray();
        for (int child = 0; child < card.getChildCount(); child++) children.put(describe(card.getChild(child)));
        samples.put(new JSONObject().put("stage", "card-descendants").put("theme", theme).put("children", children));
        check(card.getChildCount() == 0, "interactive card exposes descendants");
        click(card);
        focus("Favoritos: " + (index + 1));
        focus("Controles independentes");
        AccessibilityNodeInfo slider = focus("temperature");
        check(slider.getRangeInfo().getMin() == 16 && slider.getRangeInfo().getMax() == 28, "semantic slider bounds");
        pause(2000);
        check(slider.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD), "increment rejected");
        pause(3500); value(slider, 21.1); capture("slider-increase", slider);
        check(slider.performAction(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD), "decrement rejected");
        pause(3500); value(slider, 21); capture("slider-decrease", slider);
        slider = focus("partial");
        slider.performAction(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD);
        pause(3500); value(slider, 0.9); capture("partial-decrease", slider);
        slider.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
        pause(3500); value(slider, 1); capture("partial-increase", slider);
        Bundle progress = new Bundle(); progress.putFloat(AccessibilityNodeInfo.ACTION_ARGUMENT_PROGRESS_VALUE, 0.94f);
        slider.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS.getId(), progress);
        pause(500); value(slider, 0.9);
        progress.putFloat(AccessibilityNodeInfo.ACTION_ARGUMENT_PROGRESS_VALUE, 1);
        slider.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS.getId(), progress);
        pause(500); value(slider, 1);
        AccessibilityNodeInfo details = focus("details"); click(details);
        details.refresh();
        check("Ocultar detalhes".contentEquals(details.getContentDescription()), "stale details label");
        focus("Detalhes disponíveis."); click(focus("close-details"));
        current = automation.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY);
        check(current != null && "Ver detalhes".contentEquals(current.getContentDescription()), "Reveal did not return focus to its trigger");
        capture("reveal-return", current);
        AccessibilityNodeInfo button = focus("prepare");
        check(button.performAction(AccessibilityNodeInfo.ACTION_CLICK), "prepare rejected");
        pause(500); capture("loading", button); button.refresh();
        check(!button.isEnabled(), "loading remains enabled");
        check("Preparando…".contentEquals(button.getContentDescription()), "stale loading label");
        pause(3100); button.refresh(); capture("ready", button);
        check(button.isEnabled(), "ready remains disabled");
        check("Preparar sessão".contentEquals(button.getContentDescription()), "stale ready label");
        focus("Sessão pronta.");
        for (String id : new String[]{"disabled-button", "disabled-card", "disabled-slider"}) {
            AccessibilityNodeInfo disabled = focus(id);
            check(!disabled.isEnabled(), id + " enabled");
            if (id.equals("disabled-slider")) {
                check(!disabled.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD), "disabled slider accepted adjustment");
                value(disabled, 25);
            }
        }
        if (index == 0) click(focus("theme"));
    }
    @Override public void onStart() {
        Bundle result = new Bundle();
        try {
            automation = getUiAutomation(UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES);
            AccessibilityServiceInfo service = automation.getServiceInfo();
            service.flags &= ~AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
            automation.setServiceInfo(service);
            Intent launch = getTargetContext().getPackageManager().getLaunchIntentForPackage("com.getcortexlabs.mavis.catalog");
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            getTargetContext().startActivity(launch); pause(1500);
            runTheme(0); runTheme(1);
        } catch (Throwable error) {
            result.putString("failure", error.toString());
            android.util.Log.e("MavisAudit", "audit", error);
        } finally {
            try (FileWriter file = new FileWriter(new File(getTargetContext().getFilesDir(), "accessibility-check.json"))) {
                file.write(samples.toString(2));
            } catch (Exception error) { result.putString("failure", error.toString()); }
            finish(result.containsKey("failure") ? 1 : -1, result);
        }
    }
}
