from graphrag.index import GraphIndex
from neo4j import GraphDatabase

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
