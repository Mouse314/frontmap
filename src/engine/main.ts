import Point from "./math/Point.ts";
import Brigade from "./objects/Brigade.ts";
import DefenceLine from "./objects/DefenceLine.ts";
import Scene from "./state/Scene.ts";

export function initCanvas(canvas: HTMLCanvasElement) {
    const scene = new Scene(canvas);

    const brigade1 = new Brigade("11", new Point(1, 1), 1, "rgba(255, 0, 0, 1)");
    const brigade2 = new Brigade("12", new Point(2, 2), 2, "rgba(255, 0, 0, 1)");
    const brigade3 = new Brigade("13", new Point(3, 3), 3, "rgba(255, 0, 0, 1)");
    const brigade4 = new Brigade("14", new Point(4, 4), 4, "rgba(255, 0, 0, 1)");
    const brigade5 = new Brigade("15", new Point(5, 5), 5, "rgba(255, 0, 0, 1)");

    const defenceLine = new DefenceLine("defenceLine", new Point(0, 0), 1, [new Point(0, 0), new Point(-1, 1), new Point(4, 2), new Point(3, 3)], "rgba(0, 0, 255, 1)");

    scene.setObjects([brigade1, brigade2, brigade5, brigade3, brigade4, defenceLine]);

    scene.render();

    return scene;
}

