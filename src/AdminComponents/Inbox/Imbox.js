import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import ReactQuill from "react-quill";
import {
  Search,
  Trash2,
  MoreHorizontal,
  Send,
  Image,
  Paperclip,
  Smile,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BackendUrl = process.env.REACT_APP_Backend_Url;
const socket = io(BackendUrl);

const formatMessageDate = (dateString) => {
  if (!dateString) return "Date inconnue";

  const messageDate = new Date(dateString);
  if (isNaN(messageDate.getTime())) {
    console.error("Date invalide:", dateString);
    return "Date invalide";
  }

  const now = new Date();
  const diffTime = Math.abs(now - messageDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return "Hier";
  } else if (diffDays <= 7) {
    return messageDate.toLocaleDateString("fr-FR", { weekday: "long" });
  } else {
    return messageDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
};

const formatLastMessagePreview = (message) => {
  // Enlever les balises HTML du message
  const strippedMessage = message.replace(/<[^>]+>/g, "");
  return strippedMessage.length > 30
    ? strippedMessage.substring(0, 30) + "..."
    : strippedMessage;
};

const groupMessagesByDate = (messages) => {
  const groups = {};
  messages?.forEach((message) => {
    const date = formatMessageDate(message.date || new Date());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  return groups;
};

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = ["bold", "italic", "underline", "list", "bullet", "link"];
function Inbox() {
  const [allUsers, setAllUsers] = useState(null);
  const [allProfiles, setallprofiles] = useState(null);
  const [allMessage, setAllMessage] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [userSearch, setUserSearch] = useState(null);
  const [message, setMessage] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messageContainerRef = useRef(null);
  const provenance = false;

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [allMessage]);

  const handleMessageChange = (value) => {
    setMessage(value);
  };
  useEffect(() => {
    axios
      .get(`${BackendUrl}/getUsers`)
      .then((users) => {
        setAllUsers(users.data.data);
        // console.log(users.data.data);
      })
      .catch((error) => console.log(error));
    axios
      .get(`${BackendUrl}/getUserProfiles`)
      .then((users) => {
        setallprofiles(users.data.data);
      })
      .catch((error) => console.log(error));

    axios
      .get(`${BackendUrl}/getAllUserMessages`)
      .then((res) => {
        setAllMessages(res.data);
        // console.log(res.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    // Écouter les nouveaux messages du serveur
    socket.on("new_message_user", (message) => {
      axios
        .get(`${BackendUrl}/getAllUserMessages`)
        .then((res) => {
          setAllMessages(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
      if (message) {
        axios
          .get(
            `${BackendUrl}/getUserMessagesByClefUser/${message.data.clefUser}`
          )
          .then((res) => {
            setAllMessage(res.data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });

    return () => {
      // Nettoyer l'écouteur du socket lors du démontage du composant
      socket.off("new_message_user");
    };
  }, []); // Retirez socket des dépendances

  const getMessages = (param) => {
    axios
      .get(`${BackendUrl}/getUserMessagesByClefUser/${param}`)
      .then((res) => {
        setAllMessage(res.data);
      })
      .catch((error) => {
        console.log(error);
      });
    axios
      .put(`${BackendUrl}/lecturAdminMessage`, { userKey: param })
      .then((resp) => {
        // console.log(resp);
      })
      .catch((erro) => {
        console.log(erro);
      });
    axios
      .get(`${BackendUrl}/getAllUserMessages`)
      .then((res2) => {
        setAllMessages(res2.data);
        // console.log(res.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  // getAllUserMessages
  const envoyer = (e) => {
    e.preventDefault();
    if (!message.length) {
      return;
    }
    axios
      .post(`${BackendUrl}/createUserMessage`, {
        message: message,
        clefUser: selectedUser?._id, // Remplacé istrue par selectedUser
        provenance: provenance,
      })
      .then((res) => {
        socket.emit("new_message_u", {
          data: {
            message: message,
            clefUser: selectedUser?._id, // Remplacé istrue par selectedUser
            provenance: provenance,
          },
        });
        setMessage("");
        axios
          .get(`${BackendUrl}/getUserMessagesByClefUser/${selectedUser?._id}`) // Remplacé istrue par selectedUser
          .then((re) => {
            setAllMessage(re.data);
          })
          .catch((erro) => {
            console.log(erro);
          });
      })
      .catch((error) => console.log(error));
  };

  const searchByName = (name) => {
    if (name.length < 2) {
      return;
    }
    axios
      .get(`${BackendUrl}/getUserByName/${name}`)
      .then((res) => {
        setUserSearch(res.data.users);
      })
      .catch((error) => {
        // console.log(error);
        setUserSearch(null);
      });
  };

  const deletmessage = (param) => {
    axios
      .delete(`${BackendUrl}/deleteUserMessageById/${param}`)
      .then((res) => {
        alert(res.data.message);
        socket.emit("delete_message", res.data.message);

        axios
          .get(`${BackendUrl}/getUserMessagesByClefUser/${selectedUser?._id}`) // Correction ici
          .then((re) => {
            setAllMessage(re.data);
          })
          .catch((erro) => {
            console.log(erro);
          });
      })
      .catch((error) => console.log(error));
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    getMessages(user._id);
    if (isMobileView) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setShowSidebar(true);
  };

  // Styles personnalisés pour ReactQuill
  const customQuillStyles = {
    quillWrapper:
      "bg-background rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
    quillEditor: "min-h-[40px] max-h-[120px] overflow-y-auto",
    quillToolbar: "border-b border-input bg-muted/50 rounded-t-lg",
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-full md:w-80 border-r flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-8"
                value={searchName}
                onChange={(e) => {
                  searchByName(e.target.value);
                  setSearchName(e.target.value);
                }}
              />
            </div>
            <Button variant="ghost" size="icon" className="ml-2 md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {(!userSearch || searchName.length < 2
              ? allUsers
              : userSearch
            )?.map((user) => {
              const userMessages = allMessages.filter(
                (msg) => msg.clefUser === user._id
              );
              const lastMessage = userMessages[userMessages.length - 1];
              const unreadCount = allMessages.filter(
                (item) =>
                  item.clefUser === user._id &&
                  item.lusAdmin === false &&
                  item.provenance === true
              ).length;

              return (
                <div
                  key={user._id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    selectedUser?._id === user._id ? "bg-accent" : ""
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage
                        src={
                          allProfiles?.find(
                            (prof) => prof.clefUser === user._id
                          )?.image
                        }
                        alt={user.name}
                      />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium truncate">
                          {user.name}
                        </h4>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(lastMessage.createdAt).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage
                            ? formatLastMessagePreview(lastMessage.message)
                            : "Aucun message"}
                        </p>
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <ScrollBar />
          </ScrollArea>
        </div>
      )}

      {/* Zone de chat */}
      <div
        className={`flex-1 flex flex-col ${
          !showSidebar ? "block" : "hidden md:flex"
        }`}
      >
        {selectedUser ? (
          <>
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {isMobileView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToList}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <Avatar>
                  <AvatarImage
                    src={
                      allProfiles?.find(
                        (prof) => prof.clefUser === selectedUser._id
                      )?.image
                    }
                    alt={selectedUser.name}
                  />
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{selectedUser.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {allProfiles?.find(
                      (prof) => prof.clefUser === selectedUser._id
                    )?.numero ||
                      selectedUser?.phoneNumber ||
                      "Pas de numéro"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    Rechercher dans la conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem>Supprimer la conversation</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea className="flex-1 p-4" ref={messageContainerRef}>
              <div className="space-y-6">
                {Object.entries(groupMessagesByDate(allMessage)).map(
                  ([date, messages]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex justify-center">
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-1"
                        >
                          {date}
                        </Badge>
                      </div>
                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            msg.provenance ? "justify-start" : "justify-end"
                          } mb-2`}
                        >
                          <div
                            className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${
                              msg.provenance ? "flex-row" : "flex-row-reverse"
                            }`}
                          >
                            {/* Avatar reste identique */}
                            <div className="space-y-1">
                              <Card
                                className={`${
                                  msg.provenance
                                    ? "bg-muted"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                <CardContent className="p-3">
                                  <div
                                    className="text-sm break-words"
                                    dangerouslySetInnerHTML={{
                                      __html: msg.message,
                                    }}
                                  />
                                </CardContent>
                              </Card>
                              <div
                                className={`flex items-center gap-2 text-xs text-muted-foreground ${
                                  msg.provenance
                                    ? "justify-start"
                                    : "justify-end"
                                }`}
                              >
                                <span>
                                  {new Date(msg.date).toLocaleTimeString(
                                    "fr-FR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                                {/* Bouton de suppression reste identique */}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
              <ScrollBar />
            </ScrollArea>
            <div className="p-4 border-t">
              <form onSubmit={envoyer} className="space-y-4">
                <div className={customQuillStyles.quillWrapper}>
                  <ReactQuill
                    value={message}
                    onChange={handleMessageChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Écrivez votre message..."
                    theme="snow"
                    className={customQuillStyles.quillEditor}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="button">
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Joindre un fichier</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="button">
                            <Image className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Envoyer une image</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="button">
                            <Smile className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ajouter un emoji</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Button
                    type="submit"
                    className="ml-auto"
                    disabled={!message.length}
                  >
                    Envoyer
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Sélectionnez une conversation pour commencer à discuter
          </div>
        )}
      </div>
    </div>
  );
}

export default Inbox;
