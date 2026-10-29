package com.mavis.ui;

import android.content.Context;
import android.view.View;
import org.nativescript.widgets.FlexboxLayout;

/** Keeps the cross-axis measurement in sync with the final width of flexible children. */
public class FlexLayout extends FlexboxLayout {
    public FlexLayout(Context context) {
        super(context);
    }

    @Override
    protected void onMeasure(int widthSpec, int heightSpec) {
        boolean horizontal = getFlexDirection() == FLEX_DIRECTION_ROW
                || getFlexDirection() == FLEX_DIRECTION_ROW_REVERSE;

        int count = getChildCount();
        // Core restores percentage LayoutParams after layout. Android's measure cache can then
        // return a result from an earlier pass with different resolved LayoutParams.
        for (int i = 0; i < count; i++) getChildAt(i).forceLayout();
        super.onMeasure(widthSpec, heightSpec);

        int[] widths = new int[count];
        int[] originalWidths = new int[count];
        float[] percentages = new float[count];
        float[] grows = new float[count];
        float[] shrinks = new float[count];
        for (int i = 0; i < count; i++) {
            View child = getChildAt(i);
            LayoutParams params = (LayoutParams) child.getLayoutParams();
            widths[i] = params.width;
            originalWidths[i] = params.widthOriginal;
            percentages[i] = params.widthPercent;
            grows[i] = params.flexGrow;
            shrinks[i] = params.flexShrink;
            params.width = child.getMeasuredWidth();
            params.widthPercent = -1;
            if (horizontal) {
                params.flexGrow = 0;
                params.flexShrink = 0;
            }
            child.forceLayout();
        }
        try {
            // Core's growth pass fixes the old height even when the new width unwraps text.
            // Measure at the allocated widths so line heights and stretch use the actual content.
            super.onMeasure(widthSpec, heightSpec);
        } finally {
            for (int i = 0; i < count; i++) {
                LayoutParams params = (LayoutParams) getChildAt(i).getLayoutParams();
                params.width = widths[i];
                params.widthOriginal = originalWidths[i];
                params.widthPercent = percentages[i];
                params.flexGrow = grows[i];
                params.flexShrink = shrinks[i];
            }
        }
    }
}
