import {
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from "../../model/ipane-primitive";
import {
	BackgroundRegionsRenderer,
	BackgroundRegionsRendererData,
} from "./renderer";

export class BackgroundRegionsPaneView implements IPrimitivePaneView {
	private readonly _renderer: BackgroundRegionsRenderer =
		new BackgroundRegionsRenderer();

	public update(data: BackgroundRegionsRendererData): void {
		this._renderer.setData(data);
	}

	public renderer(): BackgroundRegionsRenderer {
		return this._renderer;
	}

	/**
	 * Return "bottom" so background regions render behind candlesticks.
	 */
	public zOrder(): PrimitivePaneViewZOrder {
		return "bottom";
	}
}

