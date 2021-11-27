import { gql, request } from "graphql-request";

const getIpfsUrl = (ipfs: string) => {
  const ipfsUrls = [
    "https://cloudflare-ipfs.com/ipfs",
    "https://infura-ipfs.io/ipfs",
    "https://dweb.link/ipfs",
    "https://gateway.pinata.cloud/ipfs",
    "https://ipfs.io/ipfs",
  ];

  return ipfs
    ? `${ipfsUrls[~~(Math.random() * ipfsUrls.length)]}/${ipfs.slice(7)}`
    : null;
};

// See https://github.com/henradio/hen-radio/blob/main/api/get-all-tracks.js for examples
const getQuery = (pageString?: string) => {
  const pageNumber = isNaN(Number(pageString)) ? 0 : Number(pageString);
  return gql`
  query AudioObjktData {
    hic_et_nunc_token(
      where: {
        mime: { _in: ["audio/ogg", "audio/wav", "audio/mpeg"] }
        token_holders: { quantity: { _gt: "0" } }
      }
      order_by: { id: desc }
      limit: ${20}
      offset: ${20 * pageNumber}) {
      id
      display_uri
      title
      description
      thumbnail_uri
      mime
      creator_id
      artifact_uri
      token_tags {
        tag {
          tag
        }
      }
      creator {
        name
        metadata
      }
      supply
    }
  }
`;
};

export async function get({ query }) {
  const response = await request(
    "https://api.hicdex.com/v1/graphql",
    getQuery(query.get("page") || "0")
  );
  return {
    body: (response?.hic_et_nunc_token || []).map((response: any) => ({
      name: response.title,
      mimetype: response.mime,
      creator: response.creator.name,
      creatorId: response.creator_id,
      cover: getIpfsUrl(response.thumbnail_uri),
      audio: getIpfsUrl(response.artifact_uri),
    })),
  };
}
