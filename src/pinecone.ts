import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const PINECONE_INDEX = pinecone.index(
  "notalx",
  "https://notalx-eke3zfo.svc.aped-4627-b74a.pinecone.io"
);

export default pinecone;
