package com.mavis.ui;

import android.content.Context;
import android.view.ViewGroup;
import org.nativescript.widgets.CommonLayoutParams;
import org.nativescript.widgets.GridLayout;

/** An auto-height Box takes its content height when the parent only limits the available space. */
public class Box extends GridLayout {
    public Box(Context context) {
        super(context);
    }

    @Override
    protected void onMeasure(int widthSpec, int heightSpec) {
        if (MeasureSpec.getMode(heightSpec) == MeasureSpec.AT_MOST && isAutoHeight()) {
            heightSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
        }
        super.onMeasure(widthSpec, heightSpec);
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
