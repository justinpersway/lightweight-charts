import {
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from "../../model/ipane-primitive";
import { HorizontalRayRenderer, HorizontalRayRendererData } from "./renderer";

export class HorizontalRayPaneView implements IPrimitivePaneView {
	private readonly _renderer: HorizontalRayRenderer =
		new HorizontalRayRenderer();

	public update(data: HorizontalRayRendererData): void {
		this._renderer.setData(data);
	}

	public renderer(): HorizontalRayRenderer {
		return this._renderer;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return "normal";
	}
}
