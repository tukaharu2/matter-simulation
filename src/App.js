// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

// import React from "react";
// import GravitySimulation from "./GravitySimulation";

// function App() {
//   return (
//     <div>
//       <h1>物理シミュレーション</h1>
//       <GravitySimulation />
//     </div>
//   );
// }

// export default App;







// import React, { useEffect, useRef, useState } from "react";
// import Matter from "matter-js";

// const MatterSimulation = () => {
//     const sceneRef = useRef(null);
//     const [removedLabels, setRemovedLabels] = useState([]);

//     useEffect(() => {
//         const engine = Matter.Engine.create();
//         const { world } = engine;

//         const render = Matter.Render.create({
//             element: sceneRef.current,
//             engine: engine,
//             options: {
//                 width: 960,
//                 height: 600,
//                 wireframes: false,
//                 background: "#f0f0f0",
//             },
//         });

//         const runner = Matter.Runner.create();
//         Matter.Runner.run(runner, engine);

//         // 床と壁の追加
//         const ground = Matter.Bodies.rectangle(400, 580, 810, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const ground2 = Matter.Bodies.rectangle(880, 300, 160, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const leftWall = Matter.Bodies.rectangle(0, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });
//         const rightWall = Matter.Bodies.rectangle(800, 375, 20, 450, { isStatic: true, render: { fillStyle: "#222" } });
//         const rightWall2 = Matter.Bodies.rectangle(960, 150, 40, 300, { isStatic: true, render: { fillStyle: "#222" } });

//         Matter.World.add(world, [ground, leftWall, rightWall, rightWall2, ground2]);

//         // 自分が操作する円 (右側の小さい空間からスタート)
//         const player = Matter.Bodies.circle(880, 200, 40, {
//             restitution: 0.2,
//             frictionAir: 0.05,
//             render: { fillStyle: "#2ecc71" },
//         });
//         Matter.World.add(world, player);

//         // 物理演算が適用されるボールの作成
//         const attractors = [];
//         const repellers = [];
//         let objects = [];

//         for (let i = 0; i < 3; i++) {
//             const redBall = Matter.Bodies.circle(150 + i * 200, 100, 30, {
//                 restitution: 0.1,
//                 frictionAir: 0.1,
//                 render: { fillStyle: "#e74c3c" },
//                 label: `引力 ${i + 1}`
//             });
//             attractors.push(redBall);
//             objects.push(redBall);
//         }

//         for (let i = 0; i < 3; i++) {
//             const blueBall = Matter.Bodies.circle(100 + i * 250, 200, 30, {
//                 restitution: 0.1,
//                 frictionAir: 0.1,
//                 render: { fillStyle: "#3498db" },
//                 label: `斥力 ${i + 1}`
//             });
//             repellers.push(blueBall);
//             objects.push(blueBall);
//         }

//         Matter.World.add(world, [...attractors, ...repellers]);

//         // 引力・斥力の処理（距離の二乗に反比例）
//         Matter.Events.on(engine, "beforeUpdate", () => {
//             attractors.forEach(obj => {
//                 const dx = player.position.x - obj.position.x;
//                 const dy = player.position.y - obj.position.y;
//                 const distanceSq = dx * dx + dy * dy + 1;

//                 // 引力（距離の二乗に反比例）
//                 const forceMagnitude = 0.5 / distanceSq;
//                 Matter.Body.applyForce(obj, obj.position, {
//                     x: dx * forceMagnitude,
//                     y: dy * forceMagnitude,
//                 });
//             });

//             repellers.forEach(obj => {
//                 const dx = obj.position.x - player.position.x;
//                 const dy = obj.position.y - player.position.y;
//                 const distanceSq = dx * dx + dy * dy + 1;

//                 // 斥力（距離の二乗に反比例）
//                 const forceMagnitude = 0.5 / distanceSq;
//                 Matter.Body.applyForce(obj, obj.position, {
//                     x: dx * forceMagnitude,
//                     y: dy * forceMagnitude,
//                 });
//             });
//         });

//         // 消滅エフェクトの関数（破裂エフェクト）
//         const createExplosion = (x, y) => {
//             let fragments = [];
//             for (let i = 0; i < 8; i++) {
//                 const fragment = Matter.Bodies.circle(x, y, 5, {
//                     restitution: 0.6,
//                     frictionAir: 0.05,
//                     render: { fillStyle: "orange" },
//                 });
//                 const angle = Math.random() * Math.PI * 2;
//                 const force = 0.03 + Math.random() * 0.05;
//                 Matter.Body.applyForce(fragment, fragment.position, {
//                     x: Math.cos(angle) * force,
//                     y: Math.sin(angle) * force,
//                 });
//                 fragments.push(fragment);
//             }
//             Matter.World.add(world, fragments);

//             // 破片を一定時間後に消す
//             setTimeout(() => {
//                 fragments.forEach(f => Matter.World.remove(world, f));
//             }, 1000);
//         };

//         // 衝突判定（右側小部屋の床にボールが触れたら消滅）
//         Matter.Events.on(engine, "collisionStart", (event) => {
//             event.pairs.forEach(pair => {
//                 if (pair.bodyA === ground2 || pair.bodyB === ground2) {
//                     const ball = pair.bodyA === ground2 ? pair.bodyB : pair.bodyA;

//                     if (objects.includes(ball)) {
//                         setRemovedLabels(prev => [...prev, ball.label]);

//                         // 爆発エフェクトを作成
//                         createExplosion(ball.position.x, ball.position.y);

//                         // 物理世界から削除
//                         Matter.World.remove(world, ball);

//                         // 配列から削除（ラベルを再描画しないように）
//                         objects = objects.filter(obj => obj !== ball);
//                     }
//                 }
//             });
//         });

//         // プレイヤーをマウスで動かせるようにする
//         const mouse = Matter.Mouse.create(render.canvas);
//         const mouseConstraint = Matter.MouseConstraint.create(engine, {
//             mouse: mouse,
//             constraint: {
//                 stiffness: 0.2,
//                 render: { visible: false },
//             },
//         });

//         Matter.World.add(world, mouseConstraint);
//         render.mouse = mouse;

//         // 番号を描画する関数
//         const drawLabels = () => {
//             const ctx = render.context;
//             ctx.font = "18px Arial";
//             ctx.fillStyle = "black";

//             objects.forEach(obj => {
//                 const { x, y } = obj.position;
//                 ctx.fillText(obj.label, x - 15, y - 40);
//             });
//         };

//         // カスタム描画イベントを追加
//         Matter.Events.on(render, "afterRender", drawLabels);

//         Matter.Render.run(render);

//         return () => {
//             Matter.World.clear(world);
//             Matter.Engine.clear(engine);
//             Matter.Render.stop(render);
//             Matter.Runner.stop(runner);
//             Matter.Events.off(render, "afterRender", drawLabels);
//             Matter.Events.off(engine, "collisionStart");
//             render.canvas.remove();
//             render.textures = {};
//         };
//     }, []);

//     return (
//         <div>
//             <div ref={sceneRef} />
//             <div style={{ position: "absolute", bottom: "20px", right: "20px", background: "white", padding: "10px", borderRadius: "5px" }}>
//                 <h3>消滅したボール</h3>
//                 <ul>
//                     {removedLabels.map((label, index) => (
//                         <li key={index}>{label}</li>
//                     ))}
//                 </ul>
//             </div>
//         </div>
//     );
// };

// export default MatterSimulation;







// import React, { useEffect, useRef, useState } from "react";
// import Matter from "matter-js";

// import image1 from "./assets/images/monsan.jpg";
// import image2 from "./assets/images/torii.jpg";
// import image3 from "./assets/images/rome.jpg";
// import image4 from "./assets/images/moai.jpg";
// import image5 from "./assets/images/familia.jpg";

// const imagePaths = [image1, image2, image3, image4, image5];

// const MatterSimulation = () => {
//     const sceneRef = useRef(null);
//     const [absorbedImages, setAbsorbedImages] = useState([]);
//     const [isReversed, setIsReversed] = useState(false);
//     const [modalImage, setModalImage] = useState(null);

//     useEffect(() => {
//         const engine = Matter.Engine.create();
//         const { world } = engine;

//         const render = Matter.Render.create({
//             element: sceneRef.current,
//             engine: engine,
//             options: {
//                 width: 960,
//                 height: 600,
//                 wireframes: false,
//                 background: "#f0f0f0",
//             },
//         });

//         const runner = Matter.Runner.create();
//         Matter.Runner.run(runner, engine);

//         // Walls and ground
//         const ground = Matter.Bodies.rectangle(400, 580, 810, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalArea = Matter.Bodies.rectangle(880, 300, 160, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const leftWall = Matter.Bodies.rectangle(0, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });
//         const rightWall = Matter.Bodies.rectangle(800, 375, 20, 450, { isStatic: true, render: { fillStyle: "#222" } });
//         const rightWall2 = Matter.Bodies.rectangle(960, 150, 40, 300, { isStatic: true, render: { fillStyle: "#222" } });
//         Matter.World.add(world, [ground, leftWall, rightWall, rightWall2, goalArea]);

//         // Player (use random image, size: 2cm ~ 80px)
//         const playerImage = imagePaths[Math.floor(Math.random() * imagePaths.length)];
//         const player = Matter.Bodies.circle(880, 200, 40, {
//             restitution: 0.2,
//             frictionAir: 0.05,
//             render: {
//                 sprite: {
//                     texture: playerImage,
//                     xScale: 0.2,
//                     yScale: 0.2,
//                 },
//             },
//         });
//         Matter.World.add(world, player);


//         // **画像サイズを取得**
//         const loadImageSize = (src) => {
//           return new Promise((resolve) => {
//               const img = new Image();
//               img.src = src;
//               img.onload = () => resolve({ width: img.width, height: img.height });
//           });
//       };

//       // **プレイヤー画像（2cm = 20px）**
//       (async () => {
//           const playerImage = imagePaths[Math.floor(Math.random() * imagePaths.length)];
//           const { width, height } = await loadImageSize(playerImage);

//           const player = Matter.Bodies.circle(880, 200, 10, {
//               restitution: 0.2,
//               frictionAir: 0.05,
//               render: {
//                   sprite: {
//                       texture: playerImage,
//                       xScale: 20 / width,  // 元画像の幅でスケール
//                       yScale: 20 / height, // 元画像の高さでスケール
//                   },
//               },
//           });
//           Matter.World.add(world, player);
//       })();

//       // **斥力・引力の画像（1cm = 10px）**
//       let objects = [];
//       const attractors = [];
//       const repellers = [];

//       (async () => {
//           for (let i = 0; i < imagePaths.length; i++) {
//               const isAttractor = i % 2 === 0;
//               const image = imagePaths[i];
//               const { width, height } = await loadImageSize(image);

//               const imgObj = Matter.Bodies.circle(100 + i * 150, 200, 5, {
//                   restitution: 0.1,
//                   frictionAir: 0.1,
//                   render: {
//                       sprite: {
//                           texture: image,
//                           xScale: 10 / width, // 元画像の幅でスケール
//                           yScale: 10 / height, // 元画像の高さでスケール
//                       },
//                   },
//                   label: image,
//               });

//               objects.push(imgObj);
//               isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
//           }

//           Matter.World.add(world, objects);
//       })();        

//         // // Image objects (size: 1cm ~ 40px)
//         // let objects = [];
//         // const attractors = [];
//         // const repellers = [];

//         // imagePaths.forEach((image, i) => {
//         //     const isAttractor = i % 2 === 0;
//         //     const imgObj = Matter.Bodies.circle(100 + i * 150, 200, 20, {
//         //         restitution: 0.1,
//         //         frictionAir: 0.1,
//         //         render: {
//         //             sprite: {
//         //                 texture: image,
//         //                 xScale: 0.1,
//         //                 yScale: 0.1,
//         //             },
//         //         },
//         //         label: image,
//         //     });
//         //     objects.push(imgObj);
//         //     isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
//         // });

//         // Matter.World.add(world, objects);

//         // Force logic
//         Matter.Events.on(engine, "beforeUpdate", () => {
//             attractors.forEach(obj => applyForce(obj, player, isReversed));
//             repellers.forEach(obj => applyForce(obj, player, !isReversed));
//         });

//         function applyForce(obj, player, isAttracting) {
//             const dx = player.position.x - obj.position.x;
//             const dy = player.position.y - obj.position.y;
//             const distanceSq = dx * dx + dy * dy + 1;
//             const forceMagnitude = 0.5 / distanceSq * (isAttracting ? 1 : -1);
//             Matter.Body.applyForce(obj, obj.position, { x: dx * forceMagnitude, y: dy * forceMagnitude });
//         }

//         // Collision event (slow absorption effect)
//         Matter.Events.on(engine, "collisionStart", (event) => {
//             event.pairs.forEach(pair => {
//                 if (pair.bodyA === goalArea || pair.bodyB === goalArea) {
//                     const obj = pair.bodyA === goalArea ? pair.bodyB : pair.bodyA;
//                     if (objects.includes(obj)) {
//                         setAbsorbedImages(prev => [...prev, obj.label]);
//                         slowlyAbsorb(obj);
//                         objects = objects.filter(o => o !== obj);
//                     }
//                 }
//             });
//         });

//         function slowlyAbsorb(obj) {
//             Matter.Body.setStatic(obj, true);
//             let interval = setInterval(() => {
//                 Matter.Body.setPosition(obj, { x: obj.position.x, y: obj.position.y + 1 });
//                 if (obj.position.y >= 580) {
//                     clearInterval(interval);
//                     Matter.World.remove(world, obj);
//                 }
//             }, 50);
//         }

//         // Mouse control
//         const mouse = Matter.Mouse.create(render.canvas);
//         const mouseConstraint = Matter.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
//         Matter.World.add(world, mouseConstraint);
//         render.mouse = mouse;

//         Matter.Render.run(render);

//         return () => {
//             Matter.World.clear(world);
//             Matter.Engine.clear(engine);
//             Matter.Render.stop(render);
//             Matter.Runner.stop(runner);
//             render.canvas.remove();
//         };
//     }, [isReversed]);

//     return (
//         <div>
//             <button onClick={() => setIsReversed(!isReversed)}>引力/斥力 反転</button>
//             <div ref={sceneRef} style={{ border: "1px solid black" }} />
//             <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
//                 {absorbedImages.map((image, index) => (
//                     <img key={index} src={image} alt="" width={180} height={180} 
//                          onClick={() => setModalImage(image)} style={{ cursor: "pointer" }} />
//                 ))}
//             </div>
//             {modalImage && (
//                 <div onClick={() => setModalImage(null)} 
//                      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <img src={modalImage} alt="Enlarged" style={{ maxWidth: "80%", maxHeight: "80%" }} />
//                 </div>
//             )}
//         </div>
//     );
// };

// export default MatterSimulation;




// import React, { useEffect, useRef, useState } from "react";
// import Matter from "matter-js";

// import image1 from "./assets/images/monsan.jpg";
// import image2 from "./assets/images/torii.jpg";
// import image3 from "./assets/images/rome.jpg";
// import image4 from "./assets/images/moai.jpg";
// import image5 from "./assets/images/familia.jpg";


// const imagePaths = [image1, image2, image3, image4, image5];



// const MatterSimulation = () => {

//     useEffect(() => {
//         const engine = Matter.Engine.create();
//         const { world } = engine;

//         const render = Matter.Render.create({
//             element: sceneRef.current,
//             engine: engine,
//             options: {
//                 width: 960,
//                 height: 600,
//                 wireframes: false,
//                 background: "#f0f0f0",
//             },
//         });

//         const runner = Matter.Runner.create();
//         Matter.Runner.run(runner, engine);

//         // 壁とゴール
//         const ground = Matter.Bodies.rectangle(400, 580, 810, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalArea = Matter.Bodies.rectangle(880, 300, 160, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const leftWall = Matter.Bodies.rectangle(0, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });
//         const rightWall = Matter.Bodies.rectangle(800, 375, 20, 450, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalWall = Matter.Bodies.rectangle(960, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });

//         Matter.World.add(world, [ground, leftWall, rightWall, goalWall, goalArea]);

//         // **画像サイズを取得**
//         const loadImageSize = (src) => {
//             return new Promise((resolve) => {
//                 const img = new Image();
//                 img.src = src;
//                 img.onload = () => resolve({ width: img.width, height: img.height });
//             });
//         };

//         let player = null; // **プレイヤーの定義**
//         let objects = [];  // **オブジェクトリスト**
//         const attractors = [];
//         const repellers = [];

//         // **非同期で画像サイズを取得し、プレイヤーと画像オブジェクトを作成**
//         (async () => {
//             const sizes = await Promise.all(imagePaths.map(loadImageSize));

//             // **プレイヤー画像（2cm = 20px）**
//             //const playerImage = imagePaths[Math.floor(Math.random() * imagePaths.length)];
//             const playerSize = sizes[imagePaths.indexOf(playerImage)];
//             player = Matter.Bodies.circle(880, 200, 10, {
//                 restitution: 0.1,
//                 frictionAir: 0.1,
//                 render: {
//                     sprite: {
//                         texture:uploadedImage,
//                         xScale: 50 / playerSize.width,
//                         yScale: 50 / playerSize.height,
//                     },
//                 },
//             });
//             Matter.World.add(world, player);

//             // **斥力・引力の画像（1cm = 10px）**
//             imagePaths.forEach((image, i) => {
//                 const isAttractor = i % 2 === 0;
//                 const size = sizes[i];

//                 const imgObj = Matter.Bodies.circle(100 + i * 150, 200, 5, {
//                     restitution: 0.1,
//                     frictionAir: 0.1,
//                     render: {
//                         sprite: {
//                             texture: image,
//                             xScale: 30 / size.width,
//                             yScale: 30 / size.height,
//                         },
//                     },
//                     label: image,
//                 });

//                 objects.push(imgObj);
//                 isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
//             });

//             Matter.World.add(world, objects);
//         })();

//         // **引力・斥力の適用**
//         Matter.Events.on(engine, "beforeUpdate", () => {
//             if (!player) return;
//             attractors.forEach(obj => applyForce(obj, player, isReversed));
//             repellers.forEach(obj => applyForce(obj, player, !isReversed));
//         });

//         function applyForce(obj, player, isAttracting) {
//             const dx = player.position.x - obj.position.x;
//             const dy = player.position.y - obj.position.y;
//             const distanceSq = dx * dx + dy * dy + 1;
//             const forceMagnitude = 0.005 / distanceSq * (isAttracting ? 1 : -1);
//             Matter.Body.applyForce(obj, obj.position, { x: dx * forceMagnitude, y: dy * forceMagnitude });
//         }

//         // **ゴールエリアの処理**
//         Matter.Events.on(engine, "collisionStart", (event) => {
//             event.pairs.forEach(pair => {
//                 if (pair.bodyA === goalArea || pair.bodyB === goalArea) {
//                     const obj = pair.bodyA === goalArea ? pair.bodyB : pair.bodyA;
//                     if (objects.includes(obj)) {
//                         setAbsorbedImages(prev => [...prev, obj.label]);
//                         slowlyAbsorb(obj);
//                         objects = objects.filter(o => o !== obj);
//                     }
//                 }

//                 if (pair.bodyA === goalWall || pair.bodyB === goalWall) {
//                     const obj = pair.bodyA === goalWall ? pair.bodyB : pair.bodyA;
//                     if (objects.includes(obj)) {
//                         slowlySink(obj);
//                         objects = objects.filter(o => o !== obj);
//                     }
//                 }
//             });
//         });

//         // **ゆっくりと吸収**
//         function slowlyAbsorb(obj) {
//             Matter.Body.setStatic(obj, true);
//             let interval = setInterval(() => {
//                 Matter.Body.setPosition(obj, { x: obj.position.x, y: obj.position.y + 1 });
//                 if (obj.position.y >= 580) {
//                     clearInterval(interval);
//                     Matter.World.remove(world, obj);
//                 }
//             }, 50);
//         }

//         // **ゆっくりと壁の下へ移動**
//         function slowlySink(obj) {
//             Matter.Body.setStatic(obj, true);
//             let interval = setInterval(() => {
//                 Matter.Body.setPosition(obj, { x: obj.position.x, y: obj.position.y + 1 });
//                 if (obj.position.y >= 600) {
//                     clearInterval(interval);
//                     Matter.World.remove(world, obj);
//                 }
//             }, 50);
//         }

//         // **マウス操作**
//         const mouse = Matter.Mouse.create(render.canvas);
//         const mouseConstraint = Matter.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
//         Matter.World.add(world, mouseConstraint);
//         render.mouse = mouse;

//         Matter.Render.run(render);

//         return () => {
//             Matter.World.clear(world);
//             Matter.Engine.clear(engine);
//             Matter.Render.stop(render);
//             Matter.Runner.stop(runner);
//             render.canvas.remove();
//         };
//     }, [isReversed]);

//     // return (
//     //     <div>
//     //         <button onClick={() => setIsReversed(!isReversed)}>引力/斥力 反転</button>
//     //         <div ref={sceneRef} style={{ border: "1px solid black" }} />
//     //     </div>
//     // );
//     return (
//               <div>
//                   <button onClick={() => setIsReversed(!isReversed)}>引力/斥力 反転</button>
//                   <div ref={sceneRef} style={{ border: "1px solid black" }} />
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
//                       {absorbedImages.map((image, index) => (
//                           <img key={index} src={image} alt="" width={180} height={180} 
//                                onClick={() => setModalImage(image)} style={{ cursor: "pointer" }} />
//                       ))}
//                   </div>
//                   {modalImage && (
//                       <div onClick={() => setModalImage(null)} 
//                            style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                           <img src={modalImage} alt="Enlarged" style={{ maxWidth: "80%", maxHeight: "80%" }} />
//                       </div>
//                   )}
//               </div>
//       );
// };

// export default MatterSimulation;








// import React, { useEffect, useRef, useState } from "react";
// import Matter from "matter-js";

// import image1 from "./assets/images/monsan.jpg";
// import image2 from "./assets/images/torii.jpg";
// import image3 from "./assets/images/rome.jpg";
// import image4 from "./assets/images/moai.jpg";
// import image5 from "./assets/images/familia.jpg";

// const imagePaths = [image1, image2, image3, image4, image5];


// const MatterSimulation = () => {
//     const sceneRef = useRef(null);
//     const [uploadedImage, setUploadedImage] = useState(null);
//     const [absorbedImages, setAbsorbedImages] = useState([]);
//     const [isReversed, setIsReversed] = useState(false);
//     const [modalImage, setModalImage] = useState(null);

//     const handleImageUpload = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = () => setUploadedImage(reader.result);
//             reader.readAsDataURL(file);
//         }
//     };

//     useEffect(() => {
//         if (!uploadedImage) return; // 画像がアップロードされるまで待機

//         const engine = Matter.Engine.create();
//         const { world } = engine;

//         const render = Matter.Render.create({
//             element: sceneRef.current,
//             engine: engine,
//             options: {
//                 width: 960,
//                 height: 600,
//                 wireframes: false,
//                 background: "#f0f0f0",
//             },
//         });

//         const runner = Matter.Runner.create();
//         Matter.Runner.run(runner, engine);

//         // 壁とゴール
//         const ground = Matter.Bodies.rectangle(400, 580, 810, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalArea = Matter.Bodies.rectangle(880, 300, 160, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const leftWall = Matter.Bodies.rectangle(0, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });
//         const rightWall = Matter.Bodies.rectangle(800, 375, 20, 450, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalWall = Matter.Bodies.rectangle(960, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });

//         Matter.World.add(world, [ground, leftWall, rightWall, goalWall, goalArea]);

//         // **画像サイズを取得**
//         const loadImageSize = (src) => {
//           return new Promise((resolve) => {
//               const img = new Image();
//               img.src = src;
//               img.onload = () => resolve({ width: img.width, height: img.height });
//           });
//       };

//       let player = null; // **プレイヤーの定義**
//       let objects = [];  // **オブジェクトリスト**
//       const attractors = [];
//       const repellers = [];

//       // **非同期で画像サイズを取得し、プレイヤーと画像オブジェクトを作成**
//       (async () => {
//           const sizes = await Promise.all(imagePaths.map(loadImageSize));
//           const playerSize = await loadImageSize(uploadedImage);
//           // **プレイヤー画像（2cm = 20px）**
//           //const playerImage = imagePaths[Math.floor(Math.random() * imagePaths.length)];
  
//           player = Matter.Bodies.circle(880, 200, 10, {
//               restitution: 0.1,
//               frictionAir: 0.1,
//               render: {
//                   sprite: {
//                       texture:uploadedImage,
//                       xScale: 50 / playerSize.width,
//                       yScale: 50 / playerSize.height,
//                   },
//               },
//           });
//           Matter.World.add(world, player);

//           // **斥力・引力の画像（1cm = 10px）**
//           imagePaths.forEach((image, i) => {
//               const isAttractor = i % 2 === 0;
//               const size = sizes[i];

//               const imgObj = Matter.Bodies.circle(100 + i * 150, 200, 5, {
//                   restitution: 0.1,
//                   frictionAir: 0.1,
//                   render: {
//                       sprite: {
//                           texture: image,
//                           xScale: 30 / size.width,
//                           yScale: 30 / size.height,
//                       },
//                   },
//                   label: image,
//               });

//               objects.push(imgObj);
//               isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
//           });

//           Matter.World.add(world, objects);
//       })();










//         // let player = Matter.Bodies.circle(880, 200, 10, {
//         //     restitution: 0.2,
//         //     frictionAir: 0.05,
//         //     render: {
//         //         sprite: {
//         //             texture: uploadedImage,
//         //             xScale: 20 / 100,
//         //             yScale: 20 / 100,
//         //         },
//         //     },
//         // });
//         // Matter.World.add(world, player);

//         // // プレイヤー以外の画像
        
//         // const imagePaths = [
//         //     image1, image2, image3, image4, image5
//         // ];
//         // let objects = [];
//         // const attractors = [];
//         // const repellers = [];

//         // for (let i = 0; i < imagePaths.length; i++) {
//         //     for (let j = 0; j < 3; j++) { // 各画像 3 枚ずつ
//         //         const isAttractor = (i + j) % 2 === 0;
//         //         const imgObj = Matter.Bodies.circle(100 + i * 120, 200 + j * 50, 5, {
//         //             restitution: 0.1,
//         //             frictionAir: 0.1,
//         //             render: {
//         //                 sprite: {
//         //                     texture: imagePaths[i],
//         //                     xScale: 10 / 100,
//         //                     yScale: 10 / 100,
//         //                 },
//         //             },
//         //             label: imagePaths[i],
//         //         });
//         //         objects.push(imgObj);
//         //         isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
//         //     }
//         // }
//         // Matter.World.add(world, objects);








//         // **引力・斥力の適用**
//         Matter.Events.on(engine, "beforeUpdate", () => {
//             attractors.forEach(obj => applyForce(obj, player, isReversed));
//             repellers.forEach(obj => applyForce(obj, player, !isReversed));
//         });

//         function applyForce(obj, player, isAttracting) {
//             const dx = player.position.x - obj.position.x;
//             const dy = player.position.y - obj.position.y;
//             const distanceSq = dx * dx + dy * dy + 1;
//             const forceMagnitude = 0.005 / distanceSq * (isAttracting ? 1 : -1);
//             Matter.Body.applyForce(obj, obj.position, { x: dx * forceMagnitude, y: dy * forceMagnitude });
//         }

//         // **ゴールエリアの処理**
//         Matter.Events.on(engine, "collisionStart", (event) => {
//             event.pairs.forEach(pair => {
//                 if (pair.bodyA === goalWall || pair.bodyB === goalWall) {
//                     const obj = pair.bodyA === goalWall ? pair.bodyB : pair.bodyA;
//                     if (objects.includes(obj)) {
//                         explodeAndRemove(obj);
//                         objects = objects.filter(o => o !== obj);
//                     }
//                 }
//             });
//         });

//         // **爆発エフェクト**
//         function explodeAndRemove(obj) {
//             let fragments = [];
//             for (let i = 0; i < 10; i++) {
//                 const fragment = Matter.Bodies.circle(obj.position.x, obj.position.y, 3, {
//                     restitution: 0.8,
//                     frictionAir: 0.1,
//                     render: { fillStyle: "red" },
//                 });
//                 const angle = Math.random() * Math.PI * 2;
//                 const force = 0.03 + Math.random() * 0.05;
//                 Matter.Body.applyForce(fragment, fragment.position, {
//                     x: Math.cos(angle) * force,
//                     y: Math.sin(angle) * force,
//                 });
//                 fragments.push(fragment);
//             }
//             Matter.World.add(world, fragments);

//             setTimeout(() => {
//                 fragments.forEach(f => Matter.World.remove(world, f));
//                 Matter.World.remove(world, obj);
//             }, 1500);
//         }

//         // **マウス操作**
//         const mouse = Matter.Mouse.create(render.canvas);
//         const mouseConstraint = Matter.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
//         Matter.World.add(world, mouseConstraint);
//         render.mouse = mouse;

//         Matter.Render.run(render);

//         return () => {
//             Matter.World.clear(world);
//             Matter.Engine.clear(engine);
//             Matter.Render.stop(render);
//             Matter.Runner.stop(runner);
//             render.canvas.remove();
//         };
//     }, [isReversed, uploadedImage]);

//     return (
//         <div>
//             {!uploadedImage ? (
//                 <input type="file" accept="image/*" onChange={handleImageUpload} />
//             ) : (
//                 <>
//                     <button onClick={() => setIsReversed(!isReversed)}>引力/斥力 反転</button>
//                     <div ref={sceneRef} style={{ border: "1px solid black" }} />
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
//                         {absorbedImages.map((image, index) => (
//                             <img key={index} src={image} alt="" width={180} height={180}
//                                 onClick={() => setModalImage(image)} style={{ cursor: "pointer" }} />
//                         ))}
//                     </div>
//                     {modalImage && (
//                         <div onClick={() => setModalImage(null)}
//                             style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                             <img src={modalImage} alt="Enlarged" style={{ maxWidth: "80%", maxHeight: "80%" }} />
//                         </div>
//                     )}
//                 </>
//             )}
//         </div>
//     );
// };

// export default MatterSimulation;











// import React, { useEffect, useRef, useState } from "react";
// import Matter from "matter-js";

// import image1 from "./assets/images/monsan.jpg";
// import image2 from "./assets/images/torii.jpg";
// import image3 from "./assets/images/rome.jpg";
// import image4 from "./assets/images/moai.jpg";
// import image5 from "./assets/images/familia.jpg";

// const imagePaths = [image1, image2, image3, image4, image5];

// const MatterSimulation = () => {
//     const sceneRef = useRef(null);
//     const [uploadedImage, setUploadedImage] = useState(null);
//     const [absorbedImages, setAbsorbedImages] = useState([]);
//     const [isReversed, setIsReversed] = useState(false);
//     const [modalImage, setModalImage] = useState(null);

//     const handleImageUpload = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = () => setUploadedImage(reader.result);
//             reader.readAsDataURL(file);
//         }
//     };

//     useEffect(() => {
//         if (!uploadedImage) return;

//         const engine = Matter.Engine.create();
//         const { world } = engine;

//         const render = Matter.Render.create({
//             element: sceneRef.current,
//             engine: engine,
//             options: {
//                 width: 960,
//                 height: 600,
//                 wireframes: false,
//                 background: "#f0f0f0",
//             },
//         });

//         const runner = Matter.Runner.create();
//         Matter.Runner.run(runner, engine);

//         // 壁とゴール
//         const ground = Matter.Bodies.rectangle(400, 580, 810, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalArea = Matter.Bodies.rectangle(880, 300, 160, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const leftWall = Matter.Bodies.rectangle(0, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });
//         const rightWall = Matter.Bodies.rectangle(800, 375, 20, 450, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalWall = Matter.Bodies.rectangle(960, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });

//         Matter.World.add(world, [ground, leftWall, rightWall, goalWall, goalArea]);

//         const loadImageSize = (src) => {
//             return new Promise((resolve) => {
//                 const img = new Image();
//                 img.src = src;
//                 img.onload = () => resolve({ width: img.width, height: img.height });
//             });
//         };

//         let objects = [];
//         const attractors = [];
//         const repellers = [];

//         (async () => {
//             const playerSize = await loadImageSize(uploadedImage);

//             const player = Matter.Bodies.circle(880, 200, 10, {
//                 restitution: 0.1,
//                 frictionAir: 0.1,
//                 render: {
//                     sprite: {
//                         texture: uploadedImage,
//                         xScale: 50 / playerSize.width,
//                         yScale: 50 / playerSize.height,
//                     },
//                 },
//             });
//             Matter.World.add(world, player);

//             const sizes = await Promise.all(imagePaths.map(loadImageSize));

//             imagePaths.forEach((image, i) => {
//                 for (let j = 0; j < 3; j++) {
//                     const isAttractor = (i + j) % 2 === 0;
//                     const size = sizes[i];

//                     const imgObj = Matter.Bodies.circle(100 + i * 120, 200 + j * 50, 5, {
//                         restitution: 0.1,
//                         frictionAir: 0.1,
//                         render: {
//                             sprite: {
//                                 texture: image,
//                                 xScale: 10 / size.width,
//                                 yScale: 10 / size.height,
//                             },
//                         },
//                         label: image,
//                     });

//                     objects.push(imgObj);
//                     isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
//                 }
//             });

//             Matter.World.add(world, objects);

//             Matter.Events.on(engine, "beforeUpdate", () => {
//                 attractors.forEach(obj => applyForce(obj, player, isReversed));
//                 repellers.forEach(obj => applyForce(obj, player, !isReversed));
//             });

//             function applyForce(obj, player, isAttracting) {
//                 const dx = player.position.x - obj.position.x;
//                 const dy = player.position.y - obj.position.y;
//                 const distanceSq = dx * dx + dy * dy + 1;
//                 const forceMagnitude = 0.005 / distanceSq * (isAttracting ? 1 : -1);
//                 Matter.Body.applyForce(obj, obj.position, { x: dx * forceMagnitude, y: dy * forceMagnitude });
//             }

//             Matter.Events.on(engine, "collisionStart", (event) => {
//                 event.pairs.forEach(pair => {
//                     if (pair.bodyA === goalWall || pair.bodyB === goalWall) {
//                         const obj = pair.bodyA === goalWall ? pair.bodyB : pair.bodyA;
//                         if (objects.includes(obj)) {
//                             setAbsorbedImages(prev => [...prev, obj.label]);
//                             explodeAndRemove(obj);
//                             objects = objects.filter(o => o !== obj);
//                         }
//                     }
//                 });
//             });

//             function explodeAndRemove(obj) {
//                 let fragments = [];
//                 for (let i = 0; i < 10; i++) {
//                     const fragment = Matter.Bodies.circle(obj.position.x, obj.position.y, 3, {
//                         restitution: 0.8,
//                         frictionAir: 0.1,
//                         render: { fillStyle: "red" },
//                     });
//                     const angle = Math.random() * Math.PI * 2;
//                     const force = 0.03 + Math.random() * 0.05;
//                     Matter.Body.applyForce(fragment, fragment.position, {
//                         x: Math.cos(angle) * force,
//                         y: Math.sin(angle) * force,
//                     });
//                     fragments.push(fragment);
//                 }
//                 Matter.World.add(world, fragments);

//                 setTimeout(() => {
//                     fragments.forEach(f => Matter.World.remove(world, f));
//                     Matter.World.remove(world, obj);
//                 }, 1500);
//             }

//             Matter.Render.run(render);
//         })();

//         return () => {
//             Matter.World.clear(world);
//             Matter.Engine.clear(engine);
//             Matter.Render.stop(render);
//             Matter.Runner.stop(runner);
//             render.canvas.remove();
//         };
//     }, [isReversed, uploadedImage]);

//     return (
//         <div>
//             {!uploadedImage ? (
//                 <input type="file" accept="image/*" onChange={handleImageUpload} />
//             ) : (
//                 <>
//                     <button onClick={() => setIsReversed(!isReversed)}>引力/斥力 反転</button>
//                     <div ref={sceneRef} style={{ border: "1px solid black" }} />
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
//                         {absorbedImages.map((image, index) => (
//                             <img key={index} src={image} alt="" width={180} height={180}
//                                 onClick={() => setModalImage(image)} style={{ cursor: "pointer" }} />
//                         ))}
//                     </div>
//                     {modalImage && (
//                         <div onClick={() => setModalImage(null)}
//                             style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                             <img src={modalImage} alt="Enlarged" style={{ maxWidth: "80%", maxHeight: "80%" }} />
//                         </div>
//                     )}
//                 </>
//             )}
//         </div>
//     );
// };

// export default MatterSimulation;





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
    const [absorbedImages, setAbsorbedImages] = useState([]);
    // const [isReversed, setIsReversed] = useState(false);
    const isReversedRef = useRef(false);

    const toggleReversed = () => {
        isReversedRef.current = !isReversedRef.current;
    };

    const [modalImage, setModalImage] = useState(null);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setUploadedImage(reader.result);
            reader.readAsDataURL(file);
        }
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

            const sizes = await Promise.all(imagePaths.map(loadImageSize));

            imagePaths.forEach((image, i) => {
                for (let j = 0; j < 20; j++) {
                    const isAttractor = (i + j) % 2 === 0;
                    const size = sizes[i];

                    const imgObj = Matter.Bodies.circle(100 + i * 120, 20 + j * 50, 20, {
                        restitution: 0.1,
                        frictionAir: 0.1,
                        density:0.0001,
                        render: {
                            sprite: {
                                texture: image,
                                xScale: 40 / size.width,
                                yScale: 40 / size.height,
                            },
                        },
                        label: image,
                    });

                    objects.push(imgObj);
                    isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
                }
            });

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

            Matter.Events.on(engine, "beforeUpdate", () => {
                attractors.forEach(obj => applyForce(obj, player, isReversedRef.current));
                repellers.forEach(obj => applyForce(obj, player, !isReversedRef.current));
            });
            
            
            function applyForce(obj, player, isAttracting) {
                const dx = player.position.x - obj.position.x;
                const dy = player.position.y - obj.position.y;
                const distanceSq = dx * dx + dy * dy + 1;
                const forceMagnitude = 0.03 / distanceSq * (isAttracting ? 1 : -1);
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
    }, [uploadedImage]);

    return (
        <div>
            {!uploadedImage ? (
                <input type="file" accept="image/*" onChange={handleImageUpload} />
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














// import React, { useEffect, useRef, useState } from "react";
// import Matter from "matter-js";

// import image1 from "./assets/images/monsan.jpg";
// import image2 from "./assets/images/torii.jpg";
// import image3 from "./assets/images/rome.jpg";
// import image4 from "./assets/images/moai.jpg";
// import image5 from "./assets/images/familia.jpg";

// const imagePaths = [image1, image2, image3, image4, image5];

// const MatterSimulation = () => {
//     const sceneRef = useRef(null);
//     const [absorbedImages, setAbsorbedImages] = useState([]);
//     const [isReversed, setIsReversed] = useState(false);
//     const [modalImage, setModalImage] = useState(null);

//     useEffect(() => {
//         const engine = Matter.Engine.create();
//         const { world } = engine;

//         const render = Matter.Render.create({
//             element: sceneRef.current,
//             engine: engine,
//             options: {
//                 width: 960,
//                 height: 600,
//                 wireframes: false,
//                 background: "#f0f0f0",
//             },
//         });

//         const runner = Matter.Runner.create();
//         Matter.Runner.run(runner, engine);

//         // 壁とゴール
//         const ground = Matter.Bodies.rectangle(400, 580, 810, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalArea = Matter.Bodies.rectangle(880, 300, 160, 40, { isStatic: true, render: { fillStyle: "#222" } });
//         const leftWall = Matter.Bodies.rectangle(0, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });
//         const rightWall = Matter.Bodies.rectangle(800, 375, 20, 450, { isStatic: true, render: { fillStyle: "#222" } });
//         const goalWall = Matter.Bodies.rectangle(960, 300, 40, 600, { isStatic: true, render: { fillStyle: "#222" } });

//         Matter.World.add(world, [ground, leftWall, rightWall, goalWall, goalArea]);

//         // **画像サイズを取得**
//         const loadImageSize = (src) => {
//             return new Promise((resolve) => {
//                 const img = new Image();
//                 img.src = src;
//                 img.onload = () => resolve({ width: img.width, height: img.height });
//             });
//         };

//         // **プレイヤー画像（2cm = 20px）**
//         (async () => {
//             const playerImage = imagePaths[Math.floor(Math.random() * imagePaths.length)];
//             const { width, height } = await loadImageSize(playerImage);

//             const player = Matter.Bodies.circle(880, 200, 10, {
//                 restitution: 0.2,
//                 frictionAir: 0.05,
//                 render: {
//                     sprite: {
//                         texture: playerImage,
//                         xScale: 20 / width,  // 元画像の幅でスケール
//                         yScale: 20 / height, // 元画像の高さでスケール
//                     },
//                 },
//             });
//             Matter.World.add(world, player);
//         })();

//         // **斥力・引力の画像（1cm = 10px）**
//         let objects = [];
//         const attractors = [];
//         const repellers = [];

//         (async () => {
//             for (let i = 0; i < imagePaths.length; i++) {
//                 const isAttractor = i % 2 === 0;
//                 const image = imagePaths[i];
//                 const { width, height } = await loadImageSize(image);

//                 const imgObj = Matter.Bodies.circle(100 + i * 150, 200, 5, {
//                     restitution: 0.1,
//                     frictionAir: 0.1,
//                     render: {
//                         sprite: {
//                             texture: image,
//                             xScale: 10 / width, // 元画像の幅でスケール
//                             yScale: 10 / height, // 元画像の高さでスケール
//                         },
//                     },
//                     label: image,
//                 });

//                 objects.push(imgObj);
//                 isAttractor ? attractors.push(imgObj) : repellers.push(imgObj);
//             }

//             Matter.World.add(world, objects);
//         })();

//         // **引力・斥力の適用**
//         Matter.Events.on(engine, "beforeUpdate", () => {
//             attractors.forEach(obj => applyForce(obj, player, isReversed));
//             repellers.forEach(obj => applyForce(obj, player, !isReversed));
//         });

//         function applyForce(obj, player, isAttracting) {
//             const dx = player.position.x - obj.position.x;
//             const dy = player.position.y - obj.position.y;
//             const distanceSq = dx * dx + dy * dy + 1;
//             const forceMagnitude = 0.5 / distanceSq * (isAttracting ? 1 : -1);
//             Matter.Body.applyForce(obj, obj.position, { x: dx * forceMagnitude, y: dy * forceMagnitude });
//         }

//         // **ゴールエリアの処理**
//         Matter.Events.on(engine, "collisionStart", (event) => {
//             event.pairs.forEach(pair => {
//                 if (pair.bodyA === goalArea || pair.bodyB === goalArea) {
//                     const obj = pair.bodyA === goalArea ? pair.bodyB : pair.bodyA;
//                     if (objects.includes(obj)) {
//                         setAbsorbedImages(prev => [...prev, obj.label]);
//                         slowlyAbsorb(obj);
//                         objects = objects.filter(o => o !== obj);
//                     }
//                 }

//                 if (pair.bodyA === goalWall || pair.bodyB === goalWall) {
//                     const obj = pair.bodyA === goalWall ? pair.bodyB : pair.bodyA;
//                     if (objects.includes(obj)) {
//                         slowlySink(obj);
//                         objects = objects.filter(o => o !== obj);
//                     }
//                 }
//             });
//         });

//         // **ゆっくりと吸収**
//         function slowlyAbsorb(obj) {
//             Matter.Body.setStatic(obj, true);
//             let interval = setInterval(() => {
//                 Matter.Body.setPosition(obj, { x: obj.position.x, y: obj.position.y + 1 });
//                 if (obj.position.y >= 580) {
//                     clearInterval(interval);
//                     Matter.World.remove(world, obj);
//                 }
//             }, 50);
//         }

//         // **ゆっくりと壁の下へ移動**
//         function slowlySink(obj) {
//             Matter.Body.setStatic(obj, true);
//             let interval = setInterval(() => {
//                 Matter.Body.setPosition(obj, { x: obj.position.x, y: obj.position.y + 1 });
//                 if (obj.position.y >= 600) {
//                     clearInterval(interval);
//                     Matter.World.remove(world, obj);
//                 }
//             }, 50);
//         }

//         // **マウス操作**
//         const mouse = Matter.Mouse.create(render.canvas);
//         const mouseConstraint = Matter.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
//         Matter.World.add(world, mouseConstraint);
//         render.mouse = mouse;

//         Matter.Render.run(render);

//         return () => {
//             Matter.World.clear(world);
//             Matter.Engine.clear(engine);
//             Matter.Render.stop(render);
//             Matter.Runner.stop(runner);
//             render.canvas.remove();
//         };
//     }, [isReversed]);

//     return (
//         <div>
//             <button onClick={() => setIsReversed(!isReversed)}>引力/斥力 反転</button>
//             <div ref={sceneRef} style={{ border: "1px solid black" }} />
//         </div>
//     );
// };

// export default MatterSimulation;

