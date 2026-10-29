package com.mavis.ui;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.SeekBar;

/** Keep the integer SeekBar model private to the renderer. */
public final class AccessibleSlider extends SeekBar {
    private double semanticMin;
    private double semanticMax = 100;
    private double semanticStep = 1;
    private double semanticValue;
    private String semanticLabel;

    public AccessibleSlider(Context context) {
        super(context);
    }

    public void setTrackColor(int color) {
        ColorStateList tint = ColorStateList.valueOf(color);
        setProgressTintList(tint);
        setSecondaryProgressTintList(tint);
        setProgressBackgroundTintList(tint);
        Drawable track = getProgressDrawable();
        if (track instanceof LayerDrawable) {
            Drawable background = ((LayerDrawable) track).findDrawableByLayerId(android.R.id.background);
            if (background instanceof GradientDrawable) {
                background.mutate();
                ((GradientDrawable) background).setColor(color);
            }
        }
    }

    public void setSemanticRange(double min, double max, double step, double value, String text, String label) {
        semanticMin = min;
        semanticMax = max;
        semanticStep = step;
        semanticValue = value;
        semanticLabel = label;
        setKeyProgressIncrement(1);
        if (Build.VERSION.SDK_INT >= 30) setStateDescription(text);
    }

    @Override
    public void onInitializeAccessibilityNodeInfo(AccessibilityNodeInfo info) {
        super.onInitializeAccessibilityNodeInfo(info);
        if (Build.VERSION.SDK_INT >= 30) info.setContentDescription(semanticLabel);
        info.setRangeInfo(AccessibilityNodeInfo.RangeInfo.obtain(
            AccessibilityNodeInfo.RangeInfo.RANGE_TYPE_FLOAT,
            (float) semanticMin, (float) semanticMax, (float) semanticValue));
    }

    @Override
    public boolean performAccessibilityAction(int action, Bundle arguments) {
        int next;
        if (action == AccessibilityNodeInfo.ACTION_SCROLL_FORWARD) {
            if (getProgress() == getMax()) return false;
            next = getProgress() + 1;
        } else if (action == AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD) {
            if (getProgress() == 0) return false;
            next = getProgress() - 1;
        } else if (action == AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS.getId()
                && arguments != null
                && arguments.containsKey(AccessibilityNodeInfo.ACTION_ARGUMENT_PROGRESS_VALUE)) {
            double value = arguments.getFloat(AccessibilityNodeInfo.ACTION_ARGUMENT_PROGRESS_VALUE);
            if (Double.isNaN(value) || Double.isInfinite(value)) return false;
            double previous = semanticMin + (getMax() - 1) * semanticStep;
            next = value >= previous + (semanticMax - previous) / 2
                ? getMax() : value <= semanticMin ? 0
                : (int) Math.round((value - semanticMin) / semanticStep);
        } else {
            return super.performAccessibilityAction(action, arguments);
        }
        if (!isEnabled()) return false;
        next = Math.max(0, Math.min(getMax(), next));
        if (next == getProgress()) return false;
        setProgress(next);
        return true;
    }
}
