import { Image, Text, View } from "react-native";
import {
  Details,
  records,
  ResourcePage,
} from "../../components/common/ResourcePage";
import { Badge, Button, Card, Empty, Section } from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { gymFields } from "../../constants/owner";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import {
  selectField,
  textField,
  useForm,
  type FormField,
} from "../../contexts/FormContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import { download, upload } from "../../utils/files";
import { mediaSource } from "../../utils/media";
function GymPosts({ gymId }: { gymId: string }) {
  const state = useResource<any>(`/gyms/${gymId}/my-posts`);
  const { openForm } = useForm();
  const { call } = useAuth();
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  const edit = (post?: any) =>
    openForm({
      title: post ? "Edit gym update" : "Publish gym update",
      initial: post,
      fields: [
        selectField("kind", "Post type", ["UPDATE", "OFFER", "WINNER"]),
        textField("title", "Title"),
        { key: "body", label: "Message", type: "multiline" },
        { key: "offerPrice", label: "Offer price", type: "number" },
        textField("winnerName", "Winner name", false),
        {
          key: "winnerConsent",
          label: "The winner has agreed to their name being displayed.",
          type: "switch",
        },
        { key: "startsAt", label: "Starts at", type: "date" },
        { key: "endsAt", label: "Ends at", type: "date" },
        {
          key: "isPublished",
          label: "Publish this update",
          type: "switch",
          initial: true,
        },
        { key: "poster", label: "Select poster", type: "image" },
        {
          key: "removePoster",
          label: "Remove existing poster",
          type: "switch",
        },
      ],
      onSubmit: async (values) => {
        if (
          values.kind === "WINNER" &&
          values.isPublished &&
          !values.winnerConsent
        )
          throw new Error("Confirm the winner’s consent before publishing.");
        const { poster, ...body } = values;
        await upload(
          `/gyms/${gymId}/posts${post ? `/${post.id}` : ""}`,
          body,
          poster ? [{ field: "poster", file: poster }] : [],
          post ? "PATCH" : "POST",
        );
        state.reload();
      },
    });
  return (
    <>
      <Section title="Gym updates, offers & winners" />
      <Button title="Create gym update" onPress={() => edit()} />
      {state.error && (
        <Text className="my-4 text-sm text-red-400">{state.error}</Text>
      )}
      {state.data?.data.map((post: any) => (
        <Card key={post.id}>
          <Badge title={post.kind} />
          <Text className="my-3 text-xl font-bold text-white">
            {post.title}
          </Text>
          <Text className="mb-4 text-sm leading-6 text-muted">{post.body}</Text>
          {post.posterUrl && (
            <Image
              source={mediaSource(post.posterUrl)}
              style={{ height: 200, borderRadius: 16, marginBottom: 16 }}
              resizeMode="cover"
            />
          )}
          <View className="flex-row gap-3">
            <Button secondary title="Edit post" onPress={() => edit(post)} />
            <Button
              secondary
              title="Delete post"
              busy={busy}
              onPress={() =>
                run(async () => {
                  if (
                    !(await confirm(
                      "Delete this update?",
                      "This post will be removed from the gym feed.",
                      "Delete",
                    ))
                  )
                    return;
                  await call(`/gyms/${gymId}/posts/${post.id}`, {
                    method: "DELETE",
                  });
                  state.reload();
                })
              }
            />
          </View>
        </Card>
      ))}
    </>
  );
}
export default function OwnerGymPage({ route }: ScreenProps<"OwnerGym">) {
  const { call } = useAuth();
  const { openForm } = useForm();
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  return (
    <ResourcePage title="Manage gym" path="/gyms/my-gyms">
      {(data, reload) => {
        const gym = records(data).find((g) => g.id === route.params.gymId);
        if (!gym) return <Empty title="Gym not found" />;
        const base = `/gyms/${gym.id}`;
        return (
          <>
            <Badge title={gym.status} />
            <Text className="my-5 text-3xl font-bold text-white">
              {gym.name}
            </Text>
            <Card>
              <Details data={gym} />
              <View className="mt-4">
                <Button
                  secondary
                  title="Edit gym profile"
                  onPress={() =>
                    openForm({
                      title: "Edit gym profile",
                      fields: gymFields,
                      initial: gym,
                      onSubmit: async (body) => {
                        await call(base, { method: "PATCH", body });
                        reload();
                      },
                    })
                  }
                />
              </View>
            </Card>
            <Section title="Verification documents" />
            <Text className="mb-4 text-sm leading-6 text-muted">
              Upload a PDF of your gym’s entrance, signage, and equipment.
              Maximum 10 MB and 25 pages. Updating an approved gym pauses it
              until the new document is approved.
            </Text>
            <Button
              title="Submit verification PDF"
              onPress={() =>
                openForm({
                  title: "Submit gym verification",
                  fields: [
                    {
                      key: "document",
                      label: "Choose PDF",
                      type: "file",
                      required: true,
                    },
                    ...(gym.status === "APPROVED"
                      ? [
                          {
                            key: "acknowledged",
                            label:
                              "I understand this gym will pause until the document is approved.",
                            type: "switch",
                            required: true,
                          } as FormField,
                        ]
                      : []),
                  ],
                  onSubmit: async (values) => {
                    if (
                      values.document.mimeType !== "application/pdf" ||
                      values.document.size > 10 * 1024 * 1024
                    )
                      throw new Error("Choose a PDF under 10 MB.");
                    await upload(`${base}/verification-documents`, {}, [
                      { field: "document", file: values.document },
                    ]);
                    reload();
                  },
                })
              }
            />
            {gym.verificationDocuments?.map((d: any) => (
              <Card key={d.id}>
                <Badge title={d.status} />
                <Text className="my-3 text-sm text-white">{d.fileName}</Text>
                {d.reviewNote && (
                  <Text className="mb-4 text-sm text-muted">
                    {d.reviewNote}
                  </Text>
                )}
                <Button
                  secondary
                  busy={busy}
                  title="Download PDF"
                  onPress={() =>
                    run(() =>
                      download(
                        `${base}/verification-documents/${d.id}`,
                        d.fileName,
                      ),
                    )
                  }
                />
              </Card>
            ))}
            <Section title="Gym photos" />
            <Button
              title="Upload gym photo"
              onPress={() =>
                openForm({
                  title: "Add gym photo",
                  fields: [
                    {
                      key: "image",
                      label: "Choose image",
                      type: "image",
                      required: true,
                    },
                  ],
                  onSubmit: async (values) => {
                    await upload(`${base}/images`, {}, [
                      { field: "images", file: values.image },
                    ]);
                    reload();
                  },
                })
              }
            />
            <ResponsiveGrid maxColumns={2}>
              {gym.images?.map((image: any, index: number) => (
                <Card key={image.id}>
                  <Image
                    source={{ uri: image.imageUrl }}
                    style={{ height: 190, borderRadius: 16 }}
                  />
                  <View className="mt-4 flex-row flex-wrap gap-2">
                    <Button
                      secondary
                      title={image.isPrimary ? "Primary photo" : "Set primary"}
                      busy={busy}
                      disabled={image.isPrimary}
                      onPress={() =>
                        run(async () => {
                          await call(`${base}/images/${image.id}/primary`, {
                            method: "PATCH",
                          });
                          reload();
                        })
                      }
                    />
                    <Button
                      secondary
                      title="Move earlier"
                      disabled={index === 0}
                      busy={busy}
                      onPress={() =>
                        run(async () => {
                          const ids = gym.images.map((v: any) => v.id);
                          [ids[index - 1], ids[index]] = [
                            ids[index],
                            ids[index - 1],
                          ];
                          await call(`${base}/images/reorder`, {
                            method: "PATCH",
                            body: {
                              images: ids.map(
                                (id: string, displayOrder: number) => ({
                                  id,
                                  displayOrder,
                                }),
                              ),
                            },
                          });
                          reload();
                        })
                      }
                    />
                    <Button
                      secondary
                      title="Delete"
                      busy={busy}
                      onPress={() =>
                        run(async () => {
                          if (
                            !(await confirm(
                              "Delete gym photo?",
                              "This photo will be removed from the gallery.",
                              "Delete photo",
                            ))
                          )
                            return;
                          await call(`${base}/images/${image.id}`, {
                            method: "DELETE",
                          });
                          reload();
                        })
                      }
                    />
                  </View>
                </Card>
              ))}
            </ResponsiveGrid>
            <GymPosts gymId={gym.id} />
          </>
        );
      }}
    </ResourcePage>
  );
}
