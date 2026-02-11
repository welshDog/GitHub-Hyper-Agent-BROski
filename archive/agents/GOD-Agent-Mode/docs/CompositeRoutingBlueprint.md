# Composite Nodes and Routing Utilities Blueprint

## Composite Nodes
- Encapsulate a subgraph inside a node
- Expose ports mapped to internal ports
- Execute nested graph with lifecycle and error policies
- Persist subgraph in node.data.config.subgraph
- Authoring: Composite Subgraph Editor in the Properties panel

## Routing Utilities
- Branch: split NodeIO by key
- Merge: reduce list of NodeIOs by strategy
- Condition: route NodeIO to truthy/falsy channels

## Engine Integration
- Composite executor reads subgraph and runs it.
- Handle mapping preserved for external edges.

## Validation
- Subgraph validated with HyperGraphSchema on execute
- Cross-reference checks ensure edge handles match actual ports

## Testing Targets
- Composite execution correctness and error propagation
- Branch/Merge/Condition functional behavior
- Performance budget compliance
