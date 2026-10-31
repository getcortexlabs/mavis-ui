package com.mavis.ui;

import android.view.View;
import android.view.View.MeasureSpec;
import android.view.ViewGroup;
import org.nativescript.widgets.CommonLayoutParams;

/**
 * Remembers the last measurement of a layout while nothing in its subtree asked for layout.
 *
 * Android measures every view again whenever its parent asks while a layout request is pending,
 * and flex containers ask several times per pass, so nested containers measure their leaves an
 * exponential number of times. The memo answers a repeated request from the recorded result and
 * measures again only the children that no longer hold that result.
 */
final class MeasureMemo {
    /** Layouts that own a memo report the specs their latest measurement received. */
    interface Owner {
        int memoWidthSpec();

        int memoHeightSpec();
    }

    private boolean valid;
    private boolean percentChildren;
    private boolean clamped;
    private int widthSpec;
    private int heightSpec;
    private int widthAndState;
    private int heightAndState;
    private int receivedWidthSpec;
    private int receivedHeightSpec;
    private int[] childWidthSpecs = new int[0];
    private int[] childHeightSpecs = new int[0];
    private int[] childWidths = new int[0];
    private int[] childHeights = new int[0];

    void invalidate() {
        valid = false;
    }

    int receivedWidthSpec() {
        return receivedWidthSpec;
    }

    int receivedHeightSpec() {
        return receivedHeightSpec;
    }

    /** Records the specs of the measurement that is starting, memoized or not. */
    void receive(int widthSpec, int heightSpec) {
        receivedWidthSpec = widthSpec;
        receivedHeightSpec = heightSpec;
    }

    /** True when the recorded measurement answers these specs; children that changed are measured again. */
    boolean restore(ViewGroup owner, int widthSpec, int heightSpec) {
        if (!valid) return false;
        if (!matches(widthSpec, this.widthSpec, widthAndState)) return false;
        if (!matches(heightSpec, this.heightSpec, heightAndState)) return false;
        int count = owner.getChildCount();
        if (count != childWidthSpecs.length) {
            valid = false;
            return false;
        }
        for (int i = 0; i < count; i++) {
            View child = owner.getChildAt(i);
            if (child.getVisibility() == View.GONE) continue;
            // A child still holding the recorded result was measured by this record's pass.
            if (child.getMeasuredWidthAndState() == childWidths[i]
                    && child.getMeasuredHeightAndState() == childHeights[i]) continue;
            child.measure(childWidthSpecs[i], childHeightSpecs[i]);
        }
        return true;
    }

    int widthAndState() {
        return widthAndState;
    }

    int heightAndState() {
        return heightAndState;
    }

    /**
     * Stores the measurement that just completed with the result and specs every child last
     * received. A clamped looser request is never reused for an exact size, which would shrink
     * the children; Android keeps the too-small state only for widths.
     */
    void record(ViewGroup owner, int widthSpec, int heightSpec, boolean clamped) {
        this.widthSpec = widthSpec;
        this.heightSpec = heightSpec;
        this.clamped = clamped;
        widthAndState = owner.getMeasuredWidthAndState();
        heightAndState = owner.getMeasuredHeightAndState();
        int count = owner.getChildCount();
        if (childWidthSpecs.length != count) {
            childWidthSpecs = new int[count];
            childHeightSpecs = new int[count];
            childWidths = new int[count];
            childHeights = new int[count];
        }
        percentChildren = false;
        for (int i = 0; i < count; i++) {
            View child = owner.getChildAt(i);
            ViewGroup.LayoutParams params = child.getLayoutParams();
            if (params instanceof CommonLayoutParams) {
                CommonLayoutParams common = (CommonLayoutParams) params;
                if (common.widthPercent > 0 || common.heightPercent > 0) percentChildren = true;
            }
            childWidths[i] = child.getMeasuredWidthAndState();
            childHeights[i] = child.getMeasuredHeightAndState();
            if (child instanceof Owner) {
                childWidthSpecs[i] = ((Owner) child).memoWidthSpec();
                childHeightSpecs[i] = ((Owner) child).memoHeightSpec();
            } else {
                childWidthSpecs[i] = MeasureSpec.makeMeasureSpec(child.getMeasuredWidth(), MeasureSpec.EXACTLY);
                childHeightSpecs[i] = MeasureSpec.makeMeasureSpec(child.getMeasuredHeight(), MeasureSpec.EXACTLY);
            }
        }
        valid = true;
    }

    /** Whether a looser request on either axis returned its whole limit; for layouts that cannot tell. */
    static boolean filledLimit(int widthSpec, int heightSpec, int widthAndState, int heightAndState) {
        return filled(widthSpec, widthAndState) || filled(heightSpec, heightAndState);
    }

    private static boolean filled(int spec, int sizeAndState) {
        return MeasureSpec.getMode(spec) == MeasureSpec.AT_MOST
                && (sizeAndState & View.MEASURED_SIZE_MASK) >= MeasureSpec.getSize(spec);
    }

    // An exact request for the size a looser request produced is the same measurement, unless a
    // child resolves a percentage against the request itself or the looser request clamped content
    // that wanted more room: an exact size would then shrink the children instead.
    private boolean matches(int spec, int recordedSpec, int recordedSizeAndState) {
        if (spec == recordedSpec) return true;
        if (percentChildren || clamped) return false;
        if (MeasureSpec.getMode(spec) != MeasureSpec.EXACTLY) return false;
        if (MeasureSpec.getMode(recordedSpec) == MeasureSpec.EXACTLY) return false;
        if ((recordedSizeAndState & View.MEASURED_STATE_TOO_SMALL) != 0) return false;
        return MeasureSpec.getSize(spec) == (recordedSizeAndState & View.MEASURED_SIZE_MASK);
    }
}
