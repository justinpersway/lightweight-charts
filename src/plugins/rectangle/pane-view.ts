import {
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from "../../model/ipane-primitive";
import { RectangleRenderer, RectangleRendererData } from "./renderer";

export class RectanglePaneView implements IPrimitivePaneView {
	private readonly _renderer: RectangleRenderer = new RectangleRenderer();

	public update(data: RectangleRendererData): void {
		this._renderer.setData(data);
	}

	public renderer(): RectangleRenderer {
		return this._renderer;
	}

	/**
	 * Return "bottom" so the rectangle renders behind candlesticks.
	 */
	public zOrder(): PrimitivePaneViewZOrder {
		return "bottom";
	}
}

