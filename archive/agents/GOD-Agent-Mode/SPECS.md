# Hyperflow Specifications (Genesis Edition)

## 1. Core Architecture: The HyperGraph 🕸️
We are building a **Graph-Based Visual Programming System**.
- **Why?** Spatial reasoning reduces cognitive load compared to linear text parsing.
- **The Vibe:** Think "Circuit Board" meets "Mind Map".

## 2. The Fundamental Atom: The HyperNode ⚛️
The basic unit of the system is the **HyperNode**.
- **Primary Use Case:** **Logic/Processing**.
- **Role:** It accepts data, transforms it, and passes it on.
- **Visuals:** A clean card with Inputs on the left, Outputs on the right, and the "Brain" (Config/Code) in the center.

## 3. Data Flow Strategy 🌊
- **Unidirectional:** Data flows from Left to Right.
- **Typed:** Ports have types (String, Number, Boolean, Flow).
- **Reactive:** When an input changes, the node re-evaluates.

## 4. The First Prototype: "The Echo Node"
To prove the system, we will build a simple **Transformation Node**.
- **Input:** `text` (String)
- **Logic:** `toUpperCase()`
- **Output:** `result` (String)

## 5. Technology Stack 🛠️
- **Schema:** Zod (Single Source of Truth).
- **State:** React Flow (for the graph visualization) + Zustand (for data state).
- **Execution:** Client-side sandbox.
