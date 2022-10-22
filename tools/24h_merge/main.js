const LABEL = "🤖 24 Hour Merge";
// const DELAY = 24 * 60 * 60 * 1000; // 24 hours
const DELAY = 5000;

export async function process24HourMerge({ github, context }) {
  const result = await github.graphql(
    `query($owner:String!, $repo:String!, $label:String!) { 
      repository(owner: $owner, name: $repo) {
        pullRequests(labels: [$label], first: 100, states: OPEN) {
          nodes {
            id
            title
            createdAt
          }
        }
      }
  }`,
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
      label: LABEL,
    }
  );

  const pullRequests = result.repository.pullRequests.nodes;

  if (pullRequests.length === 0) {
    console.log("No pull requests found");
    return;
  }

  const now = new Date();

  for (const pullRequest of pullRequests) {
    const createdAt = new Date(pullRequest.createdAt);
    const diff = now - createdAt;
    console.log(`Pull request ${pullRequest.title} is ${diff} ms old`);

    if (diff < DELAY) {
      console.log("Pull request is too young");
      continue;
    }

    console.log(`Merging ${pullRequest.title}`);
    await github.graphql(
      `mutation($id: ID!) {
        enablePullRequestAutoMerge(input: {pullRequestId: $id}) {
          pullRequest {
            id
          }
        }
      }`,
      {
        id: pullRequest.id,
      }
    );
  }
}
