import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Popper,
} from "@mui/material";
import apiClient from "../../../api/apiClient";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import DualGraphPlot from "../graphs/dualgraph/DualGraphPlot";
import { IoClose, IoArrowForward, IoArrowBack } from "react-icons/io5";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdTopic } from "react-icons/md";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";

const DualTopicDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useSelector((state) => state.userSlice);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [appliedTags, setAppliedTags] = useState([]);
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    if (user.id) fetchUserDetails();

    const savedTopics = localStorage.getItem("appliedTags");
    if (savedTopics) {
      const parsedTopics = JSON.parse(savedTopics);
      setSelectedTags(parsedTopics);
      setAppliedTags(parsedTopics);
    }
  }, [user.id]);

  const getDisplayName = (tag) => tag.split("|")[0].split("/")[2] || tag;

  const fetchUserDetails = async () => {
    try {
      const res = await apiClient.get(`/auth/${user.role}/${user.id}`);
      setAllTags(res?.data?.data?.topics || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.error || "Failed to fetch user details"
      );
    }
  };

  const handleTagSelect = (index, value) => {
    const newSelectedTags = [...selectedTags];
    newSelectedTags[index] = value;
    if (index < newSelectedTags.length - 1) {
      newSelectedTags.splice(index + 1);
    }
    setSelectedTags(newSelectedTags);
  };

  const handleAddDropdown = () => {
    if (selectedTags.length < 5 && selectedTags.every((t) => t)) {
      setSelectedTags([...selectedTags, null]);
    }
  };

  const handleApply = () => {
    const filteredTags = selectedTags.filter((tag) => tag);
    setAppliedTags(filteredTags);
    localStorage.setItem("appliedTags", JSON.stringify(filteredTags));
    setShowSlider(false);
  };

  const handleReset = () => {
    setSelectedTags([]);
    setAppliedTags([]);
    localStorage.removeItem("appliedTags");
  };

  const handleRemoveDropdown = (indexToRemove) => {
    setSelectedTags(
      selectedTags.filter((_, index) => index !== indexToRemove)
    );
  };

  const getAvailableTagsForDropdown = (index) => {
    return allTags.filter(
      (tag) =>
        !selectedTags.some(
          (selectedTag, selectedIndex) =>
            selectedIndex !== index && selectedTag === tag
        )
    );
  };

  const CustomPopper = (props) => (
    <Popper
      {...props}
      placement="bottom-start"
      sx={{
        minWidth: `${props.anchorEl?.clientWidth}px !important`,
        width: "fit-content !important",
        maxWidth: "90vw",
        zIndex: 1300,
      }}
      modifiers={[
        { name: "flip", enabled: false },
        { name: "preventOverflow", enabled: true },
      ]}
    />
  );

  return (
    <div>
      {/* Right Arrow Button */}
      {!showSlider && (
        <div
          onClick={() => setShowSlider(true)}
          style={{
            position: "fixed",
            top: "50%",
            left: "-80px",
            cursor: "pointer",
            zIndex: "1300",
            background: "red",
            backgroundColor: "rgb(255, 0, 0)",
            color: "white",
            padding: "5px 10px",
            transform: "translateY(-50%) rotate(270deg)",
            boxShadow: "0 2px 2px rgba(0, 0, 0, 0.19)",
            textShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
          }}
        >
          <p style={{ margin: "0" }}>
            CONFIGURE TOPICS <IoIosArrowDown size={"20"} />
          </p>
        </div>
      )}

      {/* Slider Panel */}
      <Box
        sx={{
          position: "fixed",
          left: showSlider ? 0 : -420,
          top: 0,
          height: "100dvh",
          width: isMobile ? "85vw" : 420,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 2,
          transition: "left 0.3s ease-in-out",
          zIndex: 1300,
          overflowY: "auto",
        }}
      >
        <IconButton
          onClick={() => setShowSlider(false)}
          style={{ color: "red" }}
          sx={{ position: "absolute", left: 8, top: 14 }}
        >
          <IoIosArrowBack size={24} />
        </IconButton>

        <Box sx={{ mt: 6, display: "flex", flexDirection: "column", gap: 2 }}>
          {selectedTags.map((selectedTag, index) => (
            <Box
              key={index}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <MdTopic size={24} color={theme.palette.primary.main} />
              <Autocomplete
                sx={{ flex: 1 }}
                options={getAvailableTagsForDropdown(index)}
                value={selectedTag}
                onChange={(_, newValue) => handleTagSelect(index, newValue)}
                getOptionLabel={(option) => getDisplayName(option)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Tag ${index + 1}`}
                    variant="outlined"
                    size="small"
                  />
                )}
                PopperComponent={CustomPopper}
                filterOptions={(options, state) =>
                  options.filter((option) =>
                    getDisplayName(option)
                      .toLowerCase()
                      .includes(state.inputValue.toLowerCase())
                  )
                }
              />
              {index > 0 && (
                <IconButton
                  onClick={() => handleRemoveDropdown(index)}
                  color="error"
                  size="small"
                >
                  <IoClose size={20} />
                </IconButton>
              )}
            </Box>
          ))}

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {selectedTags.length < 5 && selectedTags.every((t) => t) && (
              <Button
                variant="outlined"
                onClick={handleAddDropdown}
                fullWidth
                sx={{ borderRadius: "8px" }}
              >
                Add Tag +
              </Button>
            )}

            <Button
              variant="contained"
              onClick={handleApply}
              disabled={selectedTags.length === 0 || !selectedTags.every((t) => t)}
              fullWidth
            >
              Apply
            </Button>

            {appliedTags.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleReset}
                fullWidth
              >
                Clear All
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* DualGraphPlot Container */}
      <Box
        sx={{
          // Removed full viewport width/height
          zIndex: 1200,
        }}
      >
        <DualGraphPlot
          topic1={appliedTags[0]}
          topic2={appliedTags[1]}
          topic3={appliedTags[2]}
          topic4={appliedTags[3]}
          topic5={appliedTags[4]}
          height={window.innerHeight - (isMobile ? 110 : 60)}
          width={window.innerWidth - (isMobile ? 30 : 10)}
        />
      </Box>
    </div>
  );
};

export default DualTopicDashboard;
