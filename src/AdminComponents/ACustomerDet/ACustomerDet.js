import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Trash2,Check,Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function ModernCustomerDetails() {
  const [allUsers, setAllUsers] = useState(null);
  const [allProfiles, setAllProfiles] = useState(null);
  const [allAddress, setAllAddress] = useState(null);
  const [allCommandes, setAllCommandes] = useState(null);
  const [reduction, setReduction] = useState(0);
  const [dateExpired, setDateExpired] = useState(null);
  const [allCode, setAllCode] = useState(null);
  const params = useParams();

  const formatDate = (date) => {
    const options = { day: "numeric", month: "numeric", year: "numeric" };
    return new Date(date).toLocaleDateString("en-US", options);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commandes, users, profiles, addresses, codes] =
          await Promise.all([
            axios.get(`${BackendUrl}/getAllCommandes`),
            axios.get(`${BackendUrl}/getUsers`),
            axios.get(`${BackendUrl}/getUserProfiles`),
            axios.get(`${BackendUrl}/getAllAddressByUser`),
            axios.get(`${BackendUrl}/getCodePromoByClefUser/${params.id}`),
          ]);

        setAllCommandes(commandes.data.commandes);
        setAllUsers(users.data.data);
        setAllProfiles(profiles.data.data);
        setAllAddress(addresses.data.data);
        setAllCode(codes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [params.id]);

  const handleAddPromo = async (e) => {
    e.preventDefault();

    if (reduction <= 0) {
      alert("La réduction est incorrecte.");
      return;
    }
    if (!dateExpired) {
      alert("La date d'expiration est incorrecte.");
      return;
    }

    try {
      const response = await axios.post(`${BackendUrl}/createCodePromo`, {
        dateExpirate: dateExpired,
        prixReduiction: reduction,
        clefUser: params.id,
      });

      alert(response.data.message);
      setReduction(0);
      setDateExpired(null);

      const codes = await axios.get(
        `${BackendUrl}/getCodePromoByClefUser/${params.id}`
      );
      setAllCode(codes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCode = async (id) => {
    try {
      const response = await axios.delete(
        `${BackendUrl}/deleteCodePromo/${id}`
      );
      alert(response.data.message);

      const codes = await axios.get(
        `${BackendUrl}/getCodePromoByClefUser/${params.id}`
      );
      setAllCode(codes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const currentUser = allAddress?.find((item) => item.clefUser === params.id);
  const currentProfile = allProfiles?.find(
    (item) => item.clefUser === params.id
  );
  const currentUserDetails = allUsers?.find((item) => item._id === params.id);

  const CopyButton = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="h-8 px-2 lg:px-3"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 mr-2" />
            <span className="text-xs">Copié!</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-2" />
            <span className="text-xs">Copier</span>
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentProfile?.image} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{currentUser?.name}</h3>
                <p className="text-sm text-gray-500">Profession Du client</p>
                <p className="text-sm">
                  WhatsApp: {currentUserDetails?.whatsapp ? "Oui" : "Non"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajouter un bon de réduction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPromo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reduction">Prix à réduire</Label>
                <Input
                  id="reduction"
                  type="number"
                  value={reduction}
                  onChange={(e) => setReduction(e.target.value)}
                  placeholder="Montant de la réduction"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration">Date d'expiration</Label>
                <Input
                  id="expiration"
                  type="date"
                  onChange={(e) => setDateExpired(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Valider
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Codes Promo Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto">
              {allCode?.map((code, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors"
                >
                  <div className="space-y-2 w-full sm:w-auto mb-3 sm:mb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {code.code.substring(0, 4)}••••••
                        </span>
                        <CopyButton code={code.code} />
                      </div>
                      <p className="text-sm font-medium">
                        {code.prixReduiction} F
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs text-muted-foreground">
                      <p>Expire le: {formatDate(code.dateExpirate)}</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCode(code._id)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="sm:hidden">Supprimer</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Client</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Email</TableCell>
                  <TableCell>{currentUser?.email}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Téléphone</TableCell>
                  <TableCell>{currentUser?.numero}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Région</TableCell>
                  <TableCell>{currentUser?.region}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Adresse</TableCell>
                  <TableCell>{currentUser?.quartier}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    Nombre de commandes
                  </TableCell>
                  <TableCell>
                    {allCommandes?.filter(
                      (item) => item?.clefUser === params.id
                    )?.length || 0}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Commandes en cours
                  </TableCell>
                  <TableCell>
                    {allCommandes?.filter(
                      (item) =>
                        item?.clefUser === params.id &&
                        item.statusLivraison === "en cours"
                    )?.length || 0}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Points fidélité</TableCell>
                  <TableCell>0 pts</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacter le client</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Méthode de contact</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Votre message" />
              </div>
              <Button type="submit" className="w-full">
                Envoyer
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ModernCustomerDetails;
