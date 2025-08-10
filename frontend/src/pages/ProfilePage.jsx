import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Lock, Edit2, Save, X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState({
    name: false,
    email: false,
    password: false
  });
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    email: authUser?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleEdit = (field) => {
    setIsEditing({ ...isEditing, [field]: true });
    if (field === "name") {
      setFormData({ ...formData, fullName: authUser.fullName });
    } else if (field === "email") {
      setFormData({ ...formData, email: authUser.email });
    }
  };

  const handleCancel = (field) => {
    setIsEditing({ ...isEditing, [field]: false });
    if (field === "name") {
      setFormData({ ...formData, fullName: authUser.fullName });
    } else if (field === "email") {
      setFormData({ ...formData, email: authUser.email });
    } else if (field === "password") {
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  };

  const handleSave = async (field) => {
    try {
      if (field === "name") {
        if (!formData.fullName.trim()) {
          toast.error("Name cannot be empty");
          return;
        }
        await updateProfile({ fullName: formData.fullName });
      } else if (field === "email") {
        if (!formData.email.trim()) {
          toast.error("Email cannot be empty");
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error("Please enter a valid email");
          return;
        }
        await updateProfile({ email: formData.email });
      } else if (field === "password") {
        if (!formData.currentPassword || !formData.newPassword) {
          toast.error("Both current and new password are required");
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("New passwords don't match");
          return;
        }
        if (formData.newPassword.length < 6) {
          toast.error("New password must be at least 6 characters");
          return;
        }
        await updateProfile({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
      setIsEditing({ ...isEditing, [field]: false });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold gradient-text">Profile Settings</h1>
            <p className="mt-2 text-base-content/70">Manage your account information</p>
          </div>

          {/* Avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-primary/20 shadow-lg"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-primary hover:bg-primary-focus hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200 shadow-lg
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-primary-content" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-base-content/60">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* Profile Information Section */}
          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-base-content/70 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
                {!isEditing.name && (
                  <button
                    onClick={() => handleEdit("name")}
                    className="btn btn-ghost btn-sm gap-1 hover:bg-primary/10"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
              {isEditing.name ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input input-bordered flex-1"
                    placeholder="Enter your full name"
                    disabled={isUpdatingProfile}
                  />
                  <button
                    onClick={() => handleSave("name")}
                    disabled={isUpdatingProfile}
                    className="btn btn-primary btn-sm"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancel("name")}
                    disabled={isUpdatingProfile}
                    className="btn btn-ghost btn-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 bg-base-200 rounded-lg border border-base-300/30">
                  {authUser?.fullName}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-base-content/70 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
                {!isEditing.email && (
                  <button
                    onClick={() => handleEdit("email")}
                    className="btn btn-ghost btn-sm gap-1 hover:bg-primary/10"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
              {isEditing.email ? (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input input-bordered flex-1"
                    placeholder="Enter your email"
                    disabled={isUpdatingProfile}
                  />
                  <button
                    onClick={() => handleSave("email")}
                    disabled={isUpdatingProfile}
                    className="btn btn-primary btn-sm"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancel("email")}
                    disabled={isUpdatingProfile}
                    className="btn btn-ghost btn-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 bg-base-200 rounded-lg border border-base-300/30">
                  {authUser?.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-base-content/70 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </div>
                {!isEditing.password && (
                  <button
                    onClick={() => handleEdit("password")}
                    className="btn btn-ghost btn-sm gap-1 hover:bg-primary/10"
                  >
                    <Edit2 className="w-3 h-3" />
                    Change
                  </button>
                )}
              </div>
              {isEditing.password ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="input input-bordered w-full pr-10"
                      placeholder="Current password"
                      disabled={isUpdatingProfile}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="input input-bordered w-full pr-10"
                      placeholder="New password (min 6 characters)"
                      disabled={isUpdatingProfile}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input input-bordered w-full pr-10"
                      placeholder="Confirm new password"
                      disabled={isUpdatingProfile}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("password")}
                      disabled={isUpdatingProfile}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <Save className="w-4 h-4" />
                      Update Password
                    </button>
                    <button
                      onClick={() => handleCancel("password")}
                      disabled={isUpdatingProfile}
                      className="btn btn-ghost btn-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 bg-base-200 rounded-lg border border-base-300/30">
                  ••••••••
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-base-200/50 rounded-xl p-6 border border-base-300/20">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-base-300/30">
                <span className="text-base-content/70">Member Since</span>
                <span className="font-medium">{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-300/30">
                <span className="text-base-content/70">Account Status</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-success font-medium">Active</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-base-content/70">User ID</span>
                <span className="text-xs font-mono bg-base-300 px-2 py-1 rounded">
                  {authUser._id?.slice(-8)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
