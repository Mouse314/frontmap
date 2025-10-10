import Point from "./math/Point";
import Brigade from "./objects/Brigade";
import DefenceLine from "./objects/DefenceLine";
import Scene from "./state/Scene";

export function initCanvas(canvas: HTMLCanvasElement) {
    const scene = new Scene(canvas);

    const brigade1 = new Brigade("11", new Point(1, 1), 1, "red");
    const brigade2 = new Brigade("12", new Point(2, 2), 2, "red");
    const brigade3 = new Brigade("13", new Point(3, 3), 3, "red");
    const brigade4 = new Brigade("14", new Point(4, 4), 4, "red");
    const brigade5 = new Brigade("15", new Point(5, 5), 5, "red");

    const defenceLine = new DefenceLine("defenceLine", new Point(0, 0), 1, [new Point(0, 0), new Point(-1, 1), new Point(4, 2), new Point(3, 3)], "blue");

    scene.setObjects([brigade1, brigade2, brigade3, brigade4, brigade5, defenceLine]);

    scene.render();
}

