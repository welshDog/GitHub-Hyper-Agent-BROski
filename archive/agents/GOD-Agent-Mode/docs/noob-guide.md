# Noob Guide: 10-Minute Hyperflow

## What You Need
- Node.js and npm installed
- This repo cloned locally

## Install & Launch
- npm install
- npm run dev
- Open http://localhost:3000

## Quick Tour
- Palette: buttons to add nodes (CSV Input, Map, Sink, Branch, Merge, Condition, Composite)
- Canvas: place nodes and drag edges to connect them
- Properties: edit the selected node’s label and config
- Run buttons: Run Flow (engine) and Run with Pantheon (agent wrapper)

## First Flow (CSV → Map → Sink)
- Add CSV Input, Map, and Console Sink from the Palette
- Connect: CSV Output → Map Input, Map Output → Sink Input
- Click Run Flow
- Check the console output for transformed rows

## Import the Demo
- Go to Data → Import
- Choose a saved JSON graph
- Click Run Flow and then Run with Pantheon

## Composite Subgraph
- Add a Composite node
- Select it, then open the Composite Subgraph Editor
- Paste JSON, click Apply (must validate)
- Run Flow to execute the nested graph

### Minimal Composite JSON
{
  "id": "sub-graph",
  "nodes": [
    { "id": "s1", "type": "csvInput", "position": { "x": 0, "y": 0 }, "data": { "label": "CSV", "config": { "value": "name,age\nAda,36\nTuring,42" } }, "inputs": [], "outputs": [{ "id": "so1", "label": "Out", "type": "json" }] },
    { "id": "s2", "type": "map", "position": { "x": 200, "y": 0 }, "data": { "label": "Upper", "config": { "mode": "uppercase" } }, "inputs": [{ "id": "si1", "label": "In", "type": "json" }], "outputs": [{ "id": "so2", "label": "Out", "type": "json" }] },
    { "id": "s3", "type": "sinkConsole", "position": { "x": 400, "y": 0 }, "data": { "label": "Sink" }, "inputs": [{ "id": "si2", "label": "In", "type": "json" }], "outputs": [] }
  ],
  "edges": [
    { "id": "se1", "source": "s1", "sourceHandle": "so1", "target": "s2", "targetHandle": "si1" },
    { "id": "se2", "source": "s2", "sourceHandle": "so2", "target": "s3", "targetHandle": "si2" }
  ]
}

## Save & Load
- Export: Data → Export saves the current graph as JSON
- Import: Data → Import loads a saved graph

## Keyboard Shortcuts
- Delete: remove selected node
- Ctrl+N: add a processor node

## Troubleshooting
- Validation errors: fix JSON in Composite editor until status shows valid
- Edge handles: defaults are source "output", target "input"; ensure connections match
- Pantheon errors: the button shows an alert and an inline error message; check node configs

## Next Steps
- Try Branch/Merge/Condition nodes to shape data paths
- Change Map mode to see different transforms
- Build a larger composite as your own mini agent
