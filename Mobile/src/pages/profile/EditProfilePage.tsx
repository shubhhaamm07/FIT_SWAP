import { Image, Text, View } from "react-native";
import { API_URL, getSessionToken } from "../../api/client";
import { Details, ResourcePage } from "../../components/common/ResourcePage";
import { Button, Card, Section } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { textField, useForm } from "../../contexts/FormContext";
import type { ScreenProps } from "../../routes/types";
import { upload } from "../../utils/files";
export function EditProfileScreen({ navigation }: ScreenProps<"EditProfile">) {
  const { call, updateUser, demo } = useAuth();
  const { openForm } = useForm();
  return (
    <ResourcePage
      title="Your profile"
      subtitle="A little more you."
      path="/auth/me"
    >
      {(data, reload) => {
        const user = data.user || data;
        return (
          <>
            <Card>
              <Details data={user} omit={["avatarKey", "coverKey"]} />
              <View className="mt-5">
                <Button
                  title="Edit personal details"
                  onPress={() =>
                    openForm({
                      title: "Edit profile",
                      initial: user,
                      fields: [
                        textField("firstName", "First name"),
                        textField("lastName", "Last name"),
                        textField("username", "Username", false),
                        textField("phone", "Phone number", false),
                        textField("city", "City", false),
                        { key: "bio", label: "Bio", type: "multiline" },
                        {
                          key: "isProfilePublic",
                          label: "Display my name on marketplace listings",
                          type: "switch",
                        },
                      ],
                      onSubmit: async (body) => {
                        const result = await call<any>("/auth/me", {
                          method: "PATCH",
                          body,
                        });
                        updateUser(result.user);
                        reload();
                      },
                    })
                  }
                />
              </View>
            </Card>
            <Section title="Profile photos" />
            {["avatar", "cover"].map((type) => (
              <Card key={type}>
                <Text className="mb-4 text-lg font-bold capitalize text-white">
                  {type} photo
                </Text>
                {user[`${type}Key`] && !demo && (
                  <Image
                    source={{
                      uri: `${API_URL}/profile/${type}?v=${user.updatedAt || Date.now()}`,
                      headers: getSessionToken()
                        ? { Authorization: `Bearer ${getSessionToken()}` }
                        : undefined,
                    }}
                    style={{
                      width: "100%",
                      height: type === "cover" ? 170 : 140,
                      borderRadius: 20,
                      marginBottom: 16,
                    }}
                    resizeMode="cover"
                  />
                )}
                <Button
                  secondary
                  title={`Upload ${type} photo`}
                  onPress={() =>
                    openForm({
                      title: `Update ${type} photo`,
                      fields: [
                        {
                          key: "image",
                          label: "Choose photo",
                          type: "image",
                          required: true,
                        },
                      ],
                      onSubmit: async (body) => {
                        await upload(`/profile/${type}`, {}, [
                          { field: "image", file: body.image },
                        ]);
                        reload();
                      },
                    })
                  }
                />
              </Card>
            ))}
          </>
        );
      }}
    </ResourcePage>
  );
}
