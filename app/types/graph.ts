interface Node extends d3.SimulationNodeDatum {
  id: string;
  text: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  length: number;
}
