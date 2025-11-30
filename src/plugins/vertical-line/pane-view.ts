import {
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from "../../model/ipane-primitive";
import { VerticalLineRenderer, VerticalLineRendererData } from "./renderer";

export class VerticalLinePaneView implements IPrimitivePaneView {
	private readonly _renderer: VerticalLineRenderer = new VerticalLineRenderer();

	public update(data: VerticalLineRendererData): void {
		this._renderer.setData(data);
	}

	public renderer(): VerticalLineRenderer {
		return this._renderer;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return "normal";
	}
}
