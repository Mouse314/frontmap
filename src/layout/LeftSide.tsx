import { useState } from "react";

type LeftSideProps = {
    changeVisible: (visible: boolean) => void;
};

export default function LeftSide({ changeVisible }: LeftSideProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <aside className="left-side">
            <div className="show-hide-left-block">
                <button onClick={() => {
                    setIsVisible(!isVisible);
                    changeVisible(!isVisible);
                }} style={{}}>{isVisible ? "⬅️" : "➡️"}</button>
            </div>
            <h2>Left Side</h2>
        </aside>
    )
}
