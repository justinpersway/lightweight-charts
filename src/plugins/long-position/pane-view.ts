import {
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from "../../model/ipane-primitive";

import { LongPositionRenderer, LongPositionRendererData } from "./renderer";

export class LongPositionPaneView implements IPrimitivePaneView {
	private readonly _renderer: LongPositionRenderer = new LongPositionRenderer();

	public update(data: LongPositionRendererData): void {
		this._renderer.setData(data);
	}

	public renderer(): LongPositionRenderer {
		return this._renderer;
	}

	/**
	 * Return "normal" so the long position renders at the same level as candlesticks,
	 * ensuring labels are not obscured by grid lines.
	 */
	public zOrder(): PrimitivePaneViewZOrder {
		return "normal";
	}
}
