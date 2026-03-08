import { createSourceLoader } from "./fetch";
import type {
  GitHubEmbedCoreOptions,
  GitHubEmbedDescriptor,
  GitHubEmbedFailureResult,
  GitHubEmbedResolver,
  GitHubEmbedResult,
  GitHubEmbedSuccessResult,
  GitHubSourceLoader,
  GitHubSourceRequest,
} from "./types";
import { buildEmbedDescriptor, parseGitHubSourceRequest } from "./utils";

export { buildEmbedDescriptor, createSourceLoader, parseGitHubSourceRequest };

export type {
  GitHubEmbedCoreOptions,
  GitHubEmbedDescriptor,
  GitHubEmbedFailureResult,
  GitHubEmbedResolver,
  GitHubEmbedResult,
  GitHubEmbedSuccessResult,
  GitHubSourceRequest,
};

export function createGitHubEmbedResolver(
  options: GitHubEmbedCoreOptions = {},
): GitHubEmbedResolver {
  const loadSource = createSourceLoader(options);

  return (request) => resolveGitHubEmbed(request, options, loadSource);
}

export function resolveGitHubEmbed(
  request: GitHubSourceRequest,
  options: GitHubEmbedCoreOptions = {},
  loadSource?: GitHubSourceLoader,
): GitHubEmbedResult {
  const sourceLoader = loadSource ?? createSourceLoader(options);

  try {
    return {
      ok: true,
      descriptor: buildEmbedDescriptor(request, sourceLoader(request), options.resolveLanguage),
    };
  } catch (error) {
    return {
      ok: false,
      context: {
        error,
        request,
      },
    };
  }
}
