module.exports = {
  git: {
    commitMessage: "Release ${version}",
    tagName: "v${version}",
    tagAnnotation: "Release v${version}",
  },
  github: {
    release: true,
    releaseName: "v${version}",
  },
  npm: {
    publish: false,
  },
  hooks: {},
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "CHANGELOG.md",
      writerOpts: {
        transform: (commit) => {
          const msg = commit.header || "";
          if (/^update\s/i.test(msg)) return false;
          return commit;
        },
      },
    },
  },
};
