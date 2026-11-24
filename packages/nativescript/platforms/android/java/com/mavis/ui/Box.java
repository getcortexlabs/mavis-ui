package com.mavis.ui;

import android.content.Context;
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
