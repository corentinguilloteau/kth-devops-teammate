const core = require("@actions/core");
const github = require("@actions/github");

// most @actions toolkit packages have async methods
async function run() {
	try {
		const token = core.getInput("github_token");
		const issue = core.getInput("issue");
		const pr_author = core.getInput("pr_author");

		const octokit = github.getOctokit(token);

		console.log(`Starting teammate removal for user ${pr_author}`);

		const issue_comments = await octokit.rest.issues.listComments({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: issue,
		});

		let commentsRemoved = 0;

		for (let comment in issue_comments) {
			if (comment.user.login === pr_author) {
				await octokit.rest.issues.deleteComment({
					owner: github.context.repo.owner,
					repo: github.context.repo.repo,
					issue_number: comment.id,
				});

				commentsRemoved++;
			}
		}

		console.log(`Remove ${commentsRemoved} comment(s)`);
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
