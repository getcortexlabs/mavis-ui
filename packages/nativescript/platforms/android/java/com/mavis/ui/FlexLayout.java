package com.mavis.ui;

import android.content.Context;
import android.view.View;
import android.view.View.MeasureSpec;
import org.nativescript.widgets.FlexboxLayout;

/** Keeps the cross-axis measurement in sync with the final width of flexible children. */
public class FlexLayout extends FlexboxLayout implements MeasureMemo.Owner {
    private final MeasureMemo memo = new MeasureMemo();

    public FlexLayout(Context context) {
        super(context);
    }

    @Override
    public int memoWidthSpec() {
        return memo.receivedWidthSpec();
    }

    @Override
    public int memoHeightSpec() {
        return memo.receivedHeightSpec();
    }

    // Android's view constructors already request layout, before this field exists.
    @Override
    public void requestLayout() {
        if (memo != null) memo.invalidate();
        super.requestLayout();
    }

    @Override
    public void forceLayout() {
        if (memo != null) memo.invalidate();
        super.forceLayout();
    }

    @Override
    protected void onMeasure(int widthSpec, int heightSpec) {
        memo.receive(widthSpec, heightSpec);
        if (memo.restore(this, widthSpec, heightSpec)) {
            setMeasuredDimension(memo.widthAndState(), memo.heightAndState());
            return;
        }
        boolean column = getFlexDirection() == FLEX_DIRECTION_COLUMN
                || getFlexDirection() == FLEX_DIRECTION_COLUMN_REVERSE;
        try (ContentWidth widths = ContentWidth.resolve(this, widthSpec, column)) {
            measureContent(widthSpec, heightSpec);
        }
        memo.record(this, widthSpec, heightSpec, contentExceeds(widthSpec, heightSpec));
    }

    // Core measures a looser request without shrinking, so the children's sizes tell whether the
    // content wanted more room than the request allowed. Wrapping lines are not summed here.
    private boolean contentExceeds(int widthSpec, int heightSpec) {
        if (getFlexWrap() != FLEX_WRAP_NOWRAP) {
            return MeasureSpec.getMode(widthSpec) == MeasureSpec.AT_MOST
                    || MeasureSpec.getMode(heightSpec) == MeasureSpec.AT_MOST;
        }
        boolean horizontal = getFlexDirection() == FLEX_DIRECTION_ROW
                || getFlexDirection() == FLEX_DIRECTION_ROW_REVERSE;
        int main = 0;
        int cross = 0;
        int visible = 0;
        for (int i = 0, count = getChildCount(); i < count; i++) {
            View child = getChildAt(i);
            if (child.getVisibility() == View.GONE) continue;
            LayoutParams params = (LayoutParams) child.getLayoutParams();
            int width = child.getMeasuredWidth() + params.leftMargin + params.rightMargin;
            int height = child.getMeasuredHeight() + params.topMargin + params.bottomMargin;
            main += horizontal ? width : height;
            cross = Math.max(cross, horizontal ? height : width);
            visible++;
        }
        main += (horizontal ? getColumnGap() : getRowGap()) * Math.max(0, visible - 1);
        int contentWidth = (horizontal ? main : cross) + getPaddingLeft() + getPaddingRight();
        int contentHeight = (horizontal ? cross : main) + getPaddingTop() + getPaddingBottom();
        return exceeds(widthSpec, contentWidth) || exceeds(heightSpec, contentHeight);
    }

    private static boolean exceeds(int spec, int size) {
        return MeasureSpec.getMode(spec) == MeasureSpec.AT_MOST && MeasureSpec.getSize(spec) < size;
    }

    private void measureContent(int widthSpec, int heightSpec) {
        boolean horizontal = getFlexDirection() == FLEX_DIRECTION_ROW
                || getFlexDirection() == FLEX_DIRECTION_ROW_REVERSE;

        int count = getChildCount();
        // Core restores percentage LayoutParams after layout. Android's measure cache can then
        // return a result from an earlier pass with different resolved LayoutParams. Mavis
        // layouts key their own memo on the specs, so only other views need the forced pass.
        for (int i = 0; i < count; i++) {
            View child = getChildAt(i);
            if (!(child instanceof MeasureMemo.Owner)) child.forceLayout();
        }
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
            if (!(child instanceof MeasureMemo.Owner)) child.forceLayout();
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
        if (!horizontal && getFlexWrap() == FLEX_WRAP_NOWRAP && getRowGap() > 0) {
            keepRowGaps(heightSpec);
        }
    }

    // Core adds row gaps to a column's main size but not to its gap total, so its growth and shrink
    // passes report the column shorter by every gap. Measure the single line again with the gaps.
    private void keepRowGaps(int heightSpec) {
        int content = getPaddingTop() + getPaddingBottom();
        int visible = 0;
        for (int i = 0, count = getChildCount(); i < count; i++) {
            View child = getChildAt(i);
            if (child.getVisibility() == View.GONE) continue;
            LayoutParams params = (LayoutParams) child.getLayoutParams();
            content += child.getMeasuredHeight() + params.topMargin + params.bottomMargin;
            visible++;
        }
        content += getRowGap() * Math.max(0, visible - 1);
        content = Math.max(content, getSuggestedMinimumHeight());
        int state = getMeasuredHeightAndState() & View.MEASURED_STATE_MASK;
        setMeasuredDimension(getMeasuredWidthAndState(), resolveSizeAndState(content, heightSpec, state));
    }
}
