from camel.agents import KnowledgeGraphAgent
from neo4j import GraphDatabase

class GraphIndex:
    def __init__(self, driver):
        self.driver = driver
        # Initialize the CAMEL KnowledgeGraphAgent for entity extraction
        self.agent = KnowledgeGraphAgent()

    async def extract_entities(self, text: str):
        """
        Uses CAMEL-AI to extract entities and relationships.
        Returns a structure compatible with the ingestor's expectations.
        """
        # The agent.run typically returns a graph-like structure or a list of triples
        # We adapt it here to return nodes and relationships
        graph = await self.agent.run(text)
        return graph.nodes, graph.relationships

    async def merge_into_graph(self, nodes, relations):
        """
        Merges extracted entities into Neo4j using the provided driver.
        """
        with self.driver.session() as session:
            for node in nodes:
                session.run(
                    "MERGE (n:Entity {id: $id}) SET n.name = $name, n.label = $label, n += $props",
                    id=getattr(node, 'id', node.name), 
                    name=node.name, 
                    label=getattr(node, 'label', 'Concept'),
                    props=node.properties
                )
            for rel in relations:
                session.run(
                    "MATCH (a:Entity {id: $source}), (b:Entity {id: $target}) "
                    "MERGE (a)-[r:RELATED {type: $type}]->(b) SET r += $props",
                    source=rel.source, 
                    target=rel.target, 
                    type=rel.type, 
                    props=rel.properties
                )

class KnowledgeIngestor:
    def __init__(self, uri, auth_str):
        # Split 'username:password' into a tuple
        try:
            username, password = auth_str.split(':')
            self.driver = GraphDatabase.driver(uri, auth=(username, password))
        except (ValueError, AttributeError):
            raise ValueError("NEO4J_AUTH must be in 'username:password' format")
        
        self.index = GraphIndex(driver=self.driver)

    async def ingest_news_clipping(self, text: str):
        """
        Extracts entities (People, Institutions, Tickers) 
        and relationships to ground the simulation.
        """
        # Entity extraction logic
        nodes, relations = await self.index.extract_entities(text)
        
        # Grounding entities to market tickers
        for node in nodes:
            if node.label == "Organization":
                node.properties["ticker"] = self.lookup_ticker(node.name)
        
        await self.index.merge_into_graph(nodes, relations)
        return len(nodes)

    def lookup_ticker(self, name: str):
        # Mock logic for looking up a ticker based on organization name
        mapping = {
            "Apple": "AAPL",
            "Microsoft": "MSFT",
            "Google": "GOOGL",
            "Amazon": "AMZN",
            "Nvidia": "NVDA"
        }
        for key in mapping:
            if key.lower() in name.lower():
                return mapping[key]
        return None
