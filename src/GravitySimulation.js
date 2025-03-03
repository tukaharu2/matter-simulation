import React, { useEffect, useRef } from "react";
import Matter from "matter-js";

const GravitySimulation = () => {
  const sceneRef = useRef(null);

  useEffect(() => {
    const engine = Matter.Engine.create();
    const world = engine.world;
    
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: { width: 860, height: 600, background: "#f8f9fa", wireframes: false }
    });

    const player = Matter.Bodies.circle(400, 300, 30, { render: { fillStyle: "#ffcc00" } });
    Matter.World.add(world, player);

    const attractors = [
      Matter.Bodies.circle(200, 200, 20, { render: { fillStyle: "#00cc99" } }),
      Matter.Bodies.circle(600, 400, 20, { render: { fillStyle: "#00cc99" } }),
    ];
    Matter.World.add(world, attractors);

    const repulsors = [
      Matter.Bodies.circle(150, 450, 20, { render: { fillStyle: "#ff6666" } }),
      Matter.Bodies.circle(650, 150, 20, { render: { fillStyle: "#ff6666" } }),
    ];
    Matter.World.add(world, repulsors);

    Matter.Events.on(engine, "beforeUpdate", () => {
      attractors.forEach((obj) => applyForce(player, obj, 0.002));
      repulsors.forEach((obj) => applyForce(obj, player, 0.004));
    });

    Matter.World.add(world, Matter.MouseConstraint.create(engine, {
      mouse: Matter.Mouse.create(render.canvas),
      constraint: { stiffness: 0.2, render: { visible: false } }
    }));

    Matter.Engine.run(engine);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(world);
      Matter.Engine.clear(engine);
    };
  }, []);

  return <div ref={sceneRef} />;
};

const applyForce = (bodyA, bodyB, strength) => {
  const force = Matter.Vector.sub(bodyB.position, bodyA.position);
  const distance = Matter.Vector.magnitude(force);
  const normForce = Matter.Vector.normalise(force);
  const scaledForce = Matter.Vector.mult(normForce, strength / distance);
  Matter.Body.applyForce(bodyA, bodyA.position, scaledForce);
};

export default GravitySimulation;
