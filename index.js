const core = require("@actions/core");
const github = require("@actions/github");

const editMessage = "AUTO EDIT: Teammate found";
const prComment =
	"A comment related to you has been found on the teammate finding issue. Your comment has been marked as closed. Please edit it back if it is an error.";

// most @actions toolkit packages have async methods
async function run() {
	try {
		const token = core.getInput("github_token");
		const issue = core.getInput("issue");
		const pr_id = core.getInput("pr");

		const octokit = github.getOctokit(token);

		console.log(`Starting teammate removal for PR ${pr_id}`);

		// Fetch the pull request
		const pr = await octokit.rest.pulls.get({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: pr_id,
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

			for (let comment in issue_comments) {
				// We make sure this comment has not already been flaged
				if (!comment.body.contains(editMessage)) {
					const commentEmails = getEmailsInText(comment.body);

					for (let email in commentEmails) {
						// Check if we have a matching email
						if (prEmails.contains(email)) {
							const newBody = comment.body + "\n\n" + editMessage;

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
								body: prComment,
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
	return pr.title.toLowerCase().contains("proposal");
}

function getEmailsFromPR(pr) {
	const sections = pr.body.split("##");

	if (sections.length !== 6) {
		throw "Wrong PR format";
	}

	if (sections[2].startsWith(" Names and KTH ID")) {
		throw "Wrong PR format";
	}

	return getEmailsInText(sections[2]);
}

function getEmailsInText(text) {
	const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@kth\.se$/g;

	const emails = text.match(emailRegex);

	return emails;
}

run();
