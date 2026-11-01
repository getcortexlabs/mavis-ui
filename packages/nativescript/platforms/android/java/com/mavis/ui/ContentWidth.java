package com.mavis.ui;

import android.view.View;
import android.view.ViewGroup;
import org.nativescript.widgets.CommonLayoutParams;
import org.nativescript.widgets.FlexboxLayout;
import java.util.ArrayList;

/** Resolves widths during measurement without changing the app's declared styles. */
final class ContentWidth implements AutoCloseable {
    private final ArrayList<Saved> changed = new ArrayList<>();

    private ContentWidth() {}

    static ContentWidth resolve(ViewGroup parent, int widthSpec, boolean column) {
        ContentWidth result = null;
        boolean bounded = View.MeasureSpec.getMode(widthSpec) != View.MeasureSpec.UNSPECIFIED;
        boolean parentStretch = column
                && ((FlexboxLayout) parent).getAlignItems() == FlexboxLayout.ALIGN_ITEMS_STRETCH;
        int available = Math.max(0, View.MeasureSpec.getSize(widthSpec)
                - parent.getPaddingLeft() - parent.getPaddingRight());
        for (int i = 0; i < parent.getChildCount(); i++) {
            View child = parent.getChildAt(i);
            if (child.getVisibility() == View.GONE) continue;
            CommonLayoutParams params = (CommonLayoutParams) child.getLayoutParams();
            // Core uses zero for an unset percentage.
            boolean percent = bounded && params.widthPercent > 0;
            FlexboxLayout.LayoutParams flex = params instanceof FlexboxLayout.LayoutParams
                    ? (FlexboxLayout.LayoutParams) params : null;
            boolean fixed = params.width >= 0 || percent;
            boolean preventStretch = fixed && flex != null && column
                    && ((flex.alignSelf == -1 && parentStretch)
                    || flex.alignSelf == FlexboxLayout.ALIGN_ITEMS_STRETCH);
            if (!percent && !preventStretch) continue;
            if (result == null) result = new ContentWidth();
            result.changed.add(new Saved(params, flex));
            if (percent) {
                params.width = Math.round(available * params.widthPercent);
                params.widthPercent = -1;
            }
            if (preventStretch) flex.alignSelf = FlexboxLayout.ALIGN_ITEMS_FLEX_START;
        }
        return result;
    }

    @Override
    public void close() {
        for (Saved saved : changed) saved.restore();
    }

    private static final class Saved {
        final CommonLayoutParams params;
        final FlexboxLayout.LayoutParams flex;
        final int width;
        final int original;
        final float percent;
        final int align;

        Saved(CommonLayoutParams params, FlexboxLayout.LayoutParams flex) {
            this.params = params;
            this.flex = flex;
            width = params.width;
            original = params.widthOriginal;
            percent = params.widthPercent;
            align = flex == null ? -1 : flex.alignSelf;
        }

        void restore() {
            params.width = width;
            // Core restores percent widths again in onLayout. Seed that restoration when
            // our measurement resolved the percentage before Core had a chance to do so.
            params.widthOriginal = percent > 0 && original == Integer.MIN_VALUE ? width : original;
            params.widthPercent = percent;
            if (flex != null) flex.alignSelf = align;
        }
    }
}
