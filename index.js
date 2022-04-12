const core = require("@actions/core");
const github = require("@actions/github");

// most @actions toolkit packages have async methods
async function run() {
	try {
		const token = core.getInput("github_token");
		const issue = core.getInput("issue");
		const pr_id = core.getInput("pr_id");

		const octokit = github.getOctokit(token);

		// Fetch the pull request
		const pr = await octokit.rest.pulls.get({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			pull_number: pr_id,
		});

		// We want to be sure it is a proposal
		// and not a submission
		if (prIsProposal(pr)) {
			const prEmails = getEmailsFromPR(pr);

			// We get all the comment for teammate finding
			const issue_comments = await octokit.rest.issues.listComments({
				owner: github.context.repo.owner,
				repo: github.context.repo.repo,
				issue_number: issue,
			});

			for (let comment of issue_comments.data) {
				// We make sure this pull request has not already been handled
				if (comment.body.includes(`AUTO EDIT: Teammate found here #${pr_id}`)) {
					return;
				}
			}

			for (let comment of issue_comments.data) {
				// We make sure this comment has not already been flaged
				if (!comment.body.includes(`AUTO EDIT: Teammate found #${pr_id}`)) {
					const commentEmails = getEmailsInText(comment.body);

					for (let email of commentEmails) {
						// Check if we have a matching email
						if (prEmails.includes(email)) {
							const newBody = comment.body + "\n\n" + `AUTO EDIT: Teammate found #${pr_id}`;

							// Edit the issue comment
							await octokit.rest.issues.updateComment({
								owner: github.context.repo.owner,
								repo: github.context.repo.repo,
								comment_id: comment.id,
								body: newBody,
							});

							// Add a comment to the pull request
							await octokit.rest.issues.createComment({
								owner: github.context.repo.owner,
								repo: github.context.repo.repo,
								issue_number: pr_id,
								body: `A [comment](${comment.html_url}) related to @${comment.user.login} has been found on the teammate finding issue. \n\n Your comment has been marked as closed. Please edit it back if it is an error.`,
							});

							// If a comment has been found we don't need to check for more
							return;
						}
					}
				}
			}
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

function prIsProposal(pr) {
	return pr.data.title.toLowerCase().includes("proposal");
}

function getEmailsFromPR(pr) {
	const sections = pr.data.body.split("##");

	if (sections.length !== 6) {
		throw "Wrong PR format";
	}

	if (!sections[2].startsWith(" Names and KTH ID")) {
		throw "Wrong PR format";
	}

	return getEmailsInText(sections[2]);
}

function getEmailsInText(text) {
	const emailRegex = /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@kth\.se/g;

	const emails = text.match(emailRegex);

	return emails;
}

run();
