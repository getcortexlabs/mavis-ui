package com.mavis.ui;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import org.nativescript.widgets.CommonLayoutParams;
import org.nativescript.widgets.GridLayout;

/** An auto-height Box takes its content height when the parent only limits the available space. */
public class Box extends GridLayout implements MeasureMemo.Owner {
    private final MeasureMemo memo = new MeasureMemo();

    public Box(Context context) {
        super(context);
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        // Core interprets FILL plus a declared size as CENTER. Keep grid's own
        // inset/margin handling, but anchor fixed layers like the Web's one cell.
        int[] gravity = new int[getChildCount()];
        for (int i = 0; i < getChildCount(); i++) {
            View child = getChildAt(i);
            CommonLayoutParams params = (CommonLayoutParams) child.getLayoutParams();
            gravity[i] = params.gravity;
            int value = params.gravity == -1 ? Gravity.FILL : params.gravity;
            if ((params.width >= 0 || params.widthPercent > 0)
                    && (value & Gravity.HORIZONTAL_GRAVITY_MASK) == Gravity.FILL_HORIZONTAL) {
                value = (value & ~Gravity.HORIZONTAL_GRAVITY_MASK) | Gravity.LEFT;
            }
            if ((params.height >= 0 || params.heightPercent > 0)
                    && (value & Gravity.VERTICAL_GRAVITY_MASK) == Gravity.FILL_VERTICAL) {
                value = (value & ~Gravity.VERTICAL_GRAVITY_MASK) | Gravity.TOP;
            }
            params.gravity = value;
        }
        try {
            super.onLayout(changed, left, top, right, bottom);
        } finally {
            for (int i = 0; i < gravity.length; i++) {
                ((CommonLayoutParams) getChildAt(i).getLayoutParams()).gravity = gravity[i];
            }
        }
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
        int contentHeightSpec = heightSpec;
        if (MeasureSpec.getMode(heightSpec) == MeasureSpec.AT_MOST && isAutoHeight()) {
            contentHeightSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
        }
        try (ContentWidth widths = ContentWidth.resolve(this, widthSpec, false)) {
            super.onMeasure(widthSpec, contentHeightSpec);
        }
        memo.record(this, widthSpec, heightSpec,
                MeasureMemo.filledLimit(widthSpec, heightSpec, getMeasuredWidthAndState(), getMeasuredHeightAndState()));
    }

    private boolean isAutoHeight() {
        ViewGroup.LayoutParams params = getLayoutParams();
        if (params instanceof CommonLayoutParams) {
            CommonLayoutParams common = (CommonLayoutParams) params;
            return common.height < 0 && common.heightPercent <= 0;
        }
        return params == null || params.height < 0;
    }
}
