import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

import image1 from "./assets/images/monsan.jpg";
import image2 from "./assets/images/torii.jpg";
import image3 from "./assets/images/rome.jpg";
import image4 from "./assets/images/moai.jpg";
import image5 from "./assets/images/familia.jpg";

const imagePaths = [image1, image2, image3, image4, image5];

const MatterSimulation = () => {
    const sceneRef = useRef(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [similarImages, setSimilarImages] = useState([]);
    const [absorbedImages, setAbsorbedImages] = useState([]);
    // const [isReversed, setIsReversed] = useState(false);
    const isReversedRef = useRef(false);

    const toggleReversed = () => {
        isReversedRef.current = !isReversedRef.current;
    };

    const [modalImage, setModalImage] = useState(null);

    // const handleImageUpload = (event) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         const reader = new FileReader();
    //         reader.onload = () => setUploadedImage(reader.result);
    //         reader.readAsDataURL(file);
    //     }
    // };

    // 画像アップロード処理
    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        setUploadedImage(URL.createObjectURL(file)); // フロントで画像表示
        setSimilarImages(data.similar_images);  // 類似画像リストをセット
    };

    // 画像保存処理
    const handleSave = async () => {
        if (!uploadedImage) return;

        const response = await fetch("http://localhost:5000/save_image", {
            method: "POST",
            body: JSON.stringify({ image_url: uploadedImage }),
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        console.log("保存結果:", data);
    };



    useEffect(() => {
        if (!uploadedImage) return;

        const engine = Matter.Engine.create();
        const { world } = engine;

        const render = Matter.Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: 960,
                height: 600,
                wireframes: false,
                background: "#f0f0f0",
            },
        });

        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        // 壁とゴール
        const ground = Matter.Bodies.rectangle(375, 580, 760, 40, { isStatic: true, render: { fillStyle: "#222" } });
        const goalArea = Matter.Bodies.rectangle(855, 300, 210, 40, { isStatic: true, render: { fillStyle: "#222" } });
        const leftWall = Matter.Bodies.rectangle(0, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });
        const rightWall = Matter.Bodies.rectangle(750, 400, 20, 400, { isStatic: true, render: { fillStyle: "#222" } });
        const rightwall2 = Matter.Bodies.rectangle(960, 150, 40, 300, { isStatic: true, render: { fillStyle: "#222" } });

        Matter.World.add(world, [ground, leftWall, rightWall, goalArea, rightwall2]);

        const loadImageSize = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve({ width: img.width, height: img.height });
            });
        };

        let objects = [];
        const attractors = [];
        const repellers = [];

        (async () => {
            const playerSize = await loadImageSize(uploadedImage);

            const player = Matter.Bodies.circle(855, 200, 50, {
                restitution: 0.1,
                frictionAir: 0.2,
                density:1,
                render: {
                    sprite: {
                        texture: uploadedImage,
                        xScale: 100 / playerSize.width,
                        yScale: 100 / playerSize.height,
                    },
                },
            });
            Matter.World.add(world, player);
   

            // 画像を Matter.js の物理エンジンに追加
            const objects = similarImages.map((image, index) => {
                return Matter.Bodies.circle(100 + index * 50, 200, 20, {
                    restitution: 0.1,
                    frictionAir: 0.1,
                    render: { 
                        sprite: { 
                            texture: image.s3_thumbnail_url, 
                            xScale: 1.0, 
                            yScale: 1.0, 
                        } 
                    },
                    label: image,
                });
            });


            // const sizes = await Promise.all(imagePaths.map(loadImageSize));

            // imagePaths.forEach((image, i) => {
            //     for (let j = 0; j < 20; j++) {
            //         const isAttractor = (i + j) % 2 === 0;
            //         const size = sizes[i];

            //         const imgObj = Matter.Bodies.circle(100 + i * 120, 20 + j * 50, 20, {
            //             restitution: 0.1,
            //             frictionAir: 0.1,
            //             density:0.0001,
            //             render: {
            //                 sprite: {
            //                     texture: image,
            //                     xScale: 40 / size.width,
            //                     yScale: 40 / size.height,
            //                 },
            //             },
            //             label: image,
            //         });

            //         objects.push(imgObj);
            //         isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
            //     }
            // });

            Matter.World.add(world, objects);

            // マウスでオブジェクトを掴めるようにする
            const mouse = Matter.Mouse.create(render.canvas);
            const mouseConstraint = Matter.MouseConstraint.create(engine, {
                mouse,
                constraint: {
                    stiffness: 0.2,
                    render: { visible: false },
                },
            });

            Matter.World.add(world, mouseConstraint);
            render.mouse = mouse;

            // Matter.Events.on(engine, "beforeUpdate", () => {
            //     attractors.forEach(obj => applyForce(obj, player, isReversed));
            //     repellers.forEach(obj => applyForce(obj, player, !isReversed));
            // });

            // Matter.Events.on(engine, "beforeUpdate", () => {
            //     attractors.forEach(obj => applyForce(obj, player, isReversedRef.current));
            //     repellers.forEach(obj => applyForce(obj, player, !isReversedRef.current));
            // });

            Matter.Events.on(engine, "beforeUpdate", () => {
                objects.forEach((obj, index) => {
                    const similarity = similarImages[index]?.similarity || 0;  // 類似度を取得（デフォルトは0）
                    applyForce(obj, player, similarity);
                });
            });
            
            
            
            function applyForce(obj, player, similarity) {
                const dx = player.position.x - obj.position.x;
                const dy = player.position.y - obj.position.y;
                const distanceSq = dx * dx + dy * dy + 1;

                // コサイン類似度をもとに引力・斥力を決定（反転を考慮）
                const forceDirection = isReversedRef.current ? -1 : 1; // 反転ボタンが押されたら方向を変える
                const forceMagnitude = (similarity * 0.05 * forceDirection) / distanceSq;
                //const forceMagnitude = 0.03 / distanceSq * (isAttracting ? 1 : -1);
                Matter.Body.applyForce(obj, obj.position, { x: dx * forceMagnitude, y: dy * forceMagnitude });
            }

            Matter.Events.on(engine, "collisionStart", (event) => {
                event.pairs.forEach(pair => {
                    if (pair.bodyA === goalArea || pair.bodyB === goalArea) {
                        const obj = pair.bodyA === goalArea ? pair.bodyB : pair.bodyA;
                        if (objects.includes(obj)) {
                            explodeAndRemove(obj);
                            objects = objects.filter(o => o !== obj);
                        }
                    }
                });
            });

            function explodeAndRemove(obj) {
                let fragments = [];
                
                for (let i = 0; i < 10; i++) {
                    const fragment = Matter.Bodies.circle(obj.position.x, obj.position.y, 5, {
                        restitution: 4,
                        frictionAir: 10,
                        render: { fillStyle: "red" },
                        collisionFilter: {
                          category: 0x0002,  // **独自のカテゴリを設定**
                          mask: 0x0000       // **他の物体と衝突しない**
                      }
                    });
                    
                    const angle = Math.random() * Math.PI * 2;
                    const force = 0.01 + Math.random() * 0.001; // **より強い爆発効果**
                    
                    Matter.Body.applyForce(fragment, fragment.position, {
                        x: Math.cos(angle) * force,
                        y: Math.sin(angle) * force,
                    });
            
                    fragments.push(fragment);
                }
                
                Matter.World.add(world, fragments);
            
                // **画像のラベルを取得してリストに追加**
                const imageLabel = obj.render?.sprite?.texture;
            
                // **オブジェクトを即時消去**
                Matter.World.remove(world, obj);
            
                setTimeout(() => {
                    fragments.forEach(f => Matter.World.remove(world, f));
            
                    if (imageLabel) {
                        setAbsorbedImages(prev => [...prev, imageLabel]); // **確実に追加**
                    }
                }, 1000); // **エフェクトの時間を短縮**
            }
          
            Matter.Render.run(render);
        })();

        return () => {
            Matter.World.clear(world);
            Matter.Engine.clear(engine);
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
            render.canvas.remove();
        };
    }, [uploadedImage, similarImages]);

    return (
        <div>
            {!uploadedImage ? (
                <input type="file" accept="image/*" onChange={handleUpload} />
            ) : (
                <>
                    <button 
                        //onClick={() => setIsReversed(!isReversed)}
                        onClick={toggleReversed}
                        style={{ 
                          position: "absolute", 
                          top: "350px", 
                          left: "800px", 
                          zIndex: 10 
                        }}>
                        引力/斥力 反転
                    </button>

                    <button 
                        onClick={handleSave}
                        style={{ 
                            position: "absolute", 
                            top: "450px", 
                            left: "800px", 
                            zIndex: 10 
                        }}>
                        保存
                    </button>

                    <div ref={sceneRef} style={{ border: "1px solid black" }} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                        {absorbedImages.map((image, index) => (
                            <img key={index} src={image} alt="" width={180} height={180}
                                onClick={() => setModalImage(image)} style={{ cursor: "pointer" }} />
                        ))}
                    </div>
                    {modalImage && (
                        <div onClick={() => setModalImage(null)}
                            style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img src={modalImage} alt="Enlarged" style={{ maxWidth: "80%", maxHeight: "80%" }} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MatterSimulation;