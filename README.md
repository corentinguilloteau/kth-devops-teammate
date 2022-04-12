[![units-test](https://github.com/corentinguilloteau/kth-devops-teammate/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/corentinguilloteau/kth-devops-teammate/actions/workflows/test.yml)

# KTH DevOps course teammate action

This action is meant to be used in the [https://github.com/KTH/devops-course](KTH DevOps course repository). It edits
comments on the teammate finding issue according to proposal being made.

## Usage

You can now consume the action by referencing the v1 branch

```yaml
name: Edit teammate finding comment
on: pull_request
jobs:
    delete-teammate-search-comments:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/kth-devops-teammate-action@v1
              with:
                  issue: <issue_id>
                  pr_id: ${{ github.event.pull_request.number }}
                  github_token: ${{ secrets.GITHUB_TOKEN }}
```
