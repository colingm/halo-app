/**
 * AboutPage — /app/about
 *
 * Two sections:
 *   1. About Halo — app description, version, and tech-stack highlights.
 *   2. Feedback form — category + subject + message; on submit fires a Pendo
 *      track event and shows a Mantine success notification.
 *      No backend — feedback is not persisted, matching the demo-surface model.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Stack,
  Title,
  Text,
  Card,
  SimpleGrid,
  Badge,
  Group,
  Divider,
  Box,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'
import { Button, TextInput, Textarea, Select } from '../../../ui/primitives'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'

// ─── Form schema ────────────────────────────────────────────────────────────

const FeedbackSchema = z.object({
  category: z.string().min(1, 'Select a category'),
  subject:  z.string().min(3, 'Subject must be at least 3 characters'),
  message:  z.string().min(10, 'Message must be at least 10 characters'),
})

type FeedbackValues = z.infer<typeof FeedbackSchema>

const CATEGORY_OPTIONS = [
  { value: 'general',         label: 'General' },
  { value: 'bug',             label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other',           label: 'Other' },
]

const TECH_BADGES = [
  'React 18', 'TypeScript', 'Vite', 'React Router 6',
  'Mantine 7', 'Recharts', 'Zustand', 'React Hook Form',
  'Zod', 'localStorage',
]

// ─── Component ───────────────────────────────────────────────────────────────

export function AboutPage(): React.JSX.Element {
  const form = useForm<FeedbackValues>({
    resolver: zodResolver(FeedbackSchema),
    mode: 'onSubmit',
    defaultValues: { category: '', subject: '', message: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    if (typeof pendo !== 'undefined') {
      pendo.track('feedback_submitted', {
        category: values.category,
        subjectLength: values.subject.length,
        messageLength: values.message.length,
      })
    }

    notifications.show({
      title: 'Thanks for your feedback!',
      message: 'We appreciate you taking the time to share your thoughts.',
      color: 'green',
      icon: <IconCheck size={16} />,
      autoClose: 4000,
    })

    form.reset()
  })

  return (
    <Stack gap="xl" data-pendo-id={PENDO_IDS.about.container}>
      {/* ── About section ──────────────────────────────────────────────── */}
      <Box>
        <Title order={3} mb="xs">About Halo</Title>
        <Text c="dimmed" maw={640}>
          Halo is a demo multi-tenant SaaS app built to showcase the full Pendo
          product suite. It looks and behaves like a real project management tool —
          registration flow, task lists, reports, team management, and help — but
          all data is stored locally in your browser.
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Card withBorder radius="md" p="lg">
          <Stack gap="xs">
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">Version</Text>
            <Text fw={500}>1.0.0</Text>
          </Stack>
        </Card>
        <Card withBorder radius="md" p="lg">
          <Stack gap="xs">
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">Purpose</Text>
            <Text fw={500}>Pendo Demo Surface</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" p="lg">
        <Stack gap="sm">
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">Tech Stack</Text>
          <Group gap="xs" wrap="wrap">
            {TECH_BADGES.map((tech) => (
              <Badge key={tech} variant="light" color="indigo" radius="sm">
                {tech}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Card>

      <Divider />

      {/* ── Feedback form ──────────────────────────────────────────────── */}
      <Box maw={560}>
        <Title order={4} mb="xs">Share Feedback</Title>
        <Text c="dimmed" size="sm" mb="lg">
          Have a suggestion, found something odd, or just want to say hi? Drop us a
          note below.
        </Text>

        <form onSubmit={onSubmit} noValidate>
          <Stack gap="md">
            <Select
              pendoId={PENDO_IDS.about.feedback.category}
              label="Category"
              placeholder="Pick a category"
              data={CATEGORY_OPTIONS}
              value={form.watch('category')}
              onChange={(val) =>
                form.setValue('category', val ?? '', {
                  shouldValidate: false,
                  shouldDirty: true,
                })
              }
              error={form.formState.errors.category?.message}
            />

            <TextInput
              pendoId={PENDO_IDS.about.feedback.subject}
              label="Subject"
              placeholder="Brief summary of your feedback"
              {...form.register('subject')}
              error={form.formState.errors.subject?.message}
            />

            <Textarea
              pendoId={PENDO_IDS.about.feedback.message}
              label="Message"
              placeholder="Tell us more…"
              minRows={4}
              autosize
              {...form.register('message')}
              error={form.formState.errors.message?.message}
            />

            <Box>
              <Button
                pendoId={PENDO_IDS.about.feedback.submit}
                type="submit"
                variant="filled"
                color="indigo"
              >
                Send Feedback
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Stack>
  )
}
