package com.mavis.ui;

import android.content.Context;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import org.nativescript.widgets.GridLayout;

/** The page container: puts the soft keyboard away on a tap outside the editor or on a drag. */
public class Screen extends GridLayout {
    private final int slop;
    private boolean dismissOnTap;
    private boolean dismissOnDrag;
    private boolean tracking;
    private View editing;
    private float downX;
    private float downY;

    public Screen(Context context) {
        super(context);
        slop = ViewConfiguration.get(context).getScaledTouchSlop();
    }

    public void setKeyboardDismissal(boolean onTap, boolean onDrag) {
        dismissOnTap = onTap;
        dismissOnDrag = onDrag;
        if (!onTap && !onDrag) tracking = false;
    }

    // Every touch of the page passes here, so a tap on a button or a drag that the scroll view
    // takes over still counts. The event itself is never consumed. Clicks run from the queue
    // after the up event, so the tap waits its turn: a control that focused another editor
    // meanwhile keeps that focus.
    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                downX = event.getRawX();
                downY = event.getRawY();
                editing = findFocus();
                tracking = (dismissOnTap || dismissOnDrag)
                        && editing instanceof EditText
                        && !touchesEditor(this, downX, downY);
                break;
            case MotionEvent.ACTION_MOVE:
                // Like the interactive mode on iOS, only a drag towards the keyboard puts it
                // away; dragging the other way still scrolls the form while typing.
                if (tracking && dismissOnDrag && event.getRawY() - downY > slop) {
                    tracking = false;
                    dismiss();
                } else if (tracking && moved(event)) {
                    tracking = false;
                }
                break;
            case MotionEvent.ACTION_UP:
                if (tracking && dismissOnTap && !moved(event)) {
                    final View before = editing;
                    post(() -> {
                        if (findFocus() == before) dismiss();
                    });
                }
                tracking = false;
                break;
            case MotionEvent.ACTION_CANCEL:
                tracking = false;
                break;
            default:
                break;
        }
        return super.dispatchTouchEvent(event);
    }

    private boolean moved(MotionEvent event) {
        return Math.abs(event.getRawX() - downX) > slop || Math.abs(event.getRawY() - downY) > slop;
    }

    // A touch that starts on any editor keeps the keyboard: it focuses that editor or edits it.
    private static boolean touchesEditor(View view, float x, float y) {
        if (view.getVisibility() != View.VISIBLE) return false;
        if (view instanceof EditText) {
            int[] origin = new int[2];
            view.getLocationOnScreen(origin);
            return x >= origin[0] && x <= origin[0] + view.getWidth()
                    && y >= origin[1] && y <= origin[1] + view.getHeight();
        }
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0, count = group.getChildCount(); i < count; i++) {
                if (touchesEditor(group.getChildAt(i), x, y)) return true;
            }
        }
        return false;
    }

    // Clearing the focus makes Core report blur and hide the keyboard; hiding it here as well
    // covers editors that are not Core views.
    private void dismiss() {
        View focused = findFocus();
        if (!(focused instanceof EditText)) return;
        InputMethodManager manager =
                (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        if (manager != null) manager.hideSoftInputFromWindow(focused.getWindowToken(), 0);
        focused.clearFocus();
    }
}
