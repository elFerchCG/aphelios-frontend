import React from "react";

import {
  avatarOptions,
} from "../../../config/avatarConfig";

const AvatarPresetGrid = ({
  selectedAvatar,
  onSelect,
}) => {
  return (
    <div className="avatar-grid">
      {avatarOptions.map(
        (avatar) => {
          const selected =
            selectedAvatar !==
              "custom" &&
            selectedAvatar ===
              avatar.key;

          return (
            <button
              key={avatar.key}
              type="button"
              className={`avatar-option ${
                selected
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                onSelect(
                  avatar.key,
                )
              }
            >
              <img
                src={avatar.image}
                alt={avatar.name}
              />

              <span>
                {avatar.name}
              </span>
            </button>
          );
        },
      )}
    </div>
  );
};

export default AvatarPresetGrid;