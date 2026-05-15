import { Stack, Text, Anchor as MantineAnchor } from '@mantine/core'
import { Link } from 'react-router'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import type { HelpArticle } from '../types'

/**
 * HelpList — topic-grouped article anchor list.
 *
 * Groups articles by topic preserving first-seen insertion order (Map iteration
 * order matches insertion order in JS). Topic order is stable across reloads
 * because HELP_ARTICLES is faker.seed(42)-pinned (CONTEXT D-09).
 *
 * Treatment A (flat anchor list) is used per UI-SPEC line 419 — polished-list
 * aesthetic preferred over Treatment B card-style rows.
 */

export type HelpListProps = {
  articles: readonly HelpArticle[]
}

type TopicGroup = { topic: string; articles: HelpArticle[] }

function groupByTopic(articles: readonly HelpArticle[]): TopicGroup[] {
  const map = new Map<string, HelpArticle[]>()
  for (const a of articles) {
    const arr = map.get(a.topic) ?? []
    arr.push(a)
    map.set(a.topic, arr)
  }
  return [...map.entries()].map(([topic, articles]) => ({ topic, articles }))
}

export function HelpList({ articles }: HelpListProps): React.JSX.Element {
  const groups = groupByTopic(articles)
  return (
    <Stack gap="xl">
      {groups.map((group) => (
        <Stack key={group.topic} gap="md">
          <Text size="sm" tt="uppercase" c="dimmed" fw={500}>
            {group.topic}
          </Text>
          <Stack gap="sm">
            {group.articles.map((article) => (
              /*
               * S3 polymorphic-Anchor exception: raw Mantine Anchor with
               * component={Link} integrates with React Router. The Halo Anchor
               * wrapper does not expose polymorphic `component` typing. Value for
               * data-pendo-id still flows from PENDO_IDS — no hand-typed string.
               * Dynamic data-pendo-article-slug is MANDATORY (CLAUDE.md
               * dynamic-list parameterization rule + CONTEXT D-14).
               */
              <MantineAnchor
                key={article.id}
                component={Link}
                to={`/app/help/${article.slug}`}
                underline="hover"
                c="inherit"
                data-pendo-id={PENDO_IDS.help.article.row}
                data-pendo-article-slug={article.slug}
              >
                <Stack gap={4}>
                  <Text size="sm" fw={500}>{article.title}</Text>
                  <Text size="sm" c="dimmed">{article.summary}</Text>
                </Stack>
              </MantineAnchor>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
