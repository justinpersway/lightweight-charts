import {
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from "../../model/ipane-primitive";
import { HorizontalLineRenderer, HorizontalLineRendererData } from "./renderer";

export class HorizontalLinePaneView implements IPrimitivePaneView {
	private readonly _renderer: HorizontalLineRenderer =
		new HorizontalLineRenderer();

	public update(data: HorizontalLineRendererData): void {
		this._renderer.setData(data);
	}

	public renderer(): HorizontalLineRenderer {
		return this._renderer;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return "normal";
	}
}
