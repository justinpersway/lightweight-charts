import {
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from "../../model/ipane-primitive";
import { TrendLineRenderer, TrendLineRendererData } from "./renderer";

export class TrendLinePaneView implements IPrimitivePaneView {
	private readonly _renderer: TrendLineRenderer = new TrendLineRenderer();

	public update(data: TrendLineRendererData): void {
		this._renderer.setData(data);
	}

	public renderer(): TrendLineRenderer {
		return this._renderer;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return "normal";
	}
}
