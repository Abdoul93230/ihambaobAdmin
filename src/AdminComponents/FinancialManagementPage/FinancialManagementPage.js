import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import axios from "axios";
import FinancialOrderManager from "../FinancialOrderManager";
import { useFinancialOperations } from "../../hooks/useFinancialOperations";

const BackendUrl = process.env.REACT_APP_Backend_Url;

const FinancialManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPendingTransactions: 0,
    totalConfirmedTransactions: 0,
    totalCancelledTransactions: 0,
    totalCommissions: 0
  });
  const [dashboardStats, setDashboardStats] = useState(null);

  const { updateOrderStatus, error } = useFinancialOperations();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, productsRes, dashRes] = await Promise.all([
        axios.get(`${BackendUrl}/getAllCommandes`),
        axios.get(`${BackendUrl}/getAllProduct`),
        axios.get(`${BackendUrl}/adminf/finances/dashboard`).catch(() => ({ data: null }))
      ]);

      if (dashRes.data?.success) {
        setDashboardStats(dashRes.data.data);
      }

      const ordersWithFinancialStatus = ordersRes.data.data.map(order => ({
        ...order,
        financialStatus: getOrderFinancialStatus(order),
        products: productsRes.data.data.filter(product => 
          order.nbrProduits?.some(item => item.produit === product._id)
        )
      }));

      setOrders(ordersWithFinancialStatus);
      calculateStats(ordersWithFinancialStatus);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderFinancialStatus = (order) => {
    const { etatTraitement, statusLivraison } = order;

    if (statusLivraison === "annulé" || etatTraitement === "Annulée") {
      return { status: "cancelled", label: "Annulée", color: "red" };
    }

    if (statusLivraison === "livré" || etatTraitement === "livraison reçu" || etatTraitement === "Traité") {
      return { status: "confirmed", label: "Confirmée", color: "green" };
    }

    if (etatTraitement === "reçu par le livreur" || etatTraitement === "en cours de livraison") {
      return { status: "pending", label: "En attente", color: "yellow" };
    }

    return { status: "none", label: "Aucune", color: "gray" };
  };

  const calculateStats = (ordersList) => {
    const newStats = {
      totalPendingTransactions: 0,
      totalConfirmedTransactions: 0,
      totalCancelledTransactions: 0,
      totalCommissions: 0
    };

    ordersList.forEach(order => {
      const amount = order.prix || 0;
      // Utiliser la commission réelle de la transaction si disponible
      const transactions = order.transactionInfo || order.transactions || [];
      const realCommission = transactions.reduce((sum, t) => sum + (t.commission || 0), 0);

      switch (order.financialStatus?.status) {
        case 'pending':
          newStats.totalPendingTransactions += amount;
          break;
        case 'confirmed':
          newStats.totalConfirmedTransactions += amount;
          newStats.totalCommissions += realCommission;
          break;
        case 'cancelled':
          newStats.totalCancelledTransactions += amount;
          break;
      }
    });

    setStats(newStats);
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.financialStatus?.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order._id === updatedOrder._id 
        ? { ...updatedOrder, financialStatus: getOrderFinancialStatus(updatedOrder) }
        : order
    ));
    setSelectedOrder(updatedOrder);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(price || 0);
  };

  const getStatusBadge = (financialStatus) => {
    const colors = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      none: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={colors[financialStatus?.status] || colors.none}>
        {financialStatus?.label || "Inconnu"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement des données financières...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Gestion Financière des Commandes
        </h1>
        <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Transactions en attente</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatPrice(stats.totalPendingTransactions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Transactions confirmées</p>
                <p className="text-xl font-bold text-green-600">
                  {formatPrice(stats.totalConfirmedTransactions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Commissions totales</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatPrice(dashboardStats?.commissionsTotal ?? stats.totalCommissions)}
                </p>
                {dashboardStats && (
                  <p className="text-xs text-gray-400">Taux réels par plan</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Transactions annulées</p>
                <p className="text-xl font-bold text-red-600">
                  {formatPrice(stats.totalCancelledTransactions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par référence ou ID de commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="none">Aucune transaction</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Liste des commandes */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedOrder?._id === order._id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{order.reference}</div>
                      <div className="text-sm text-gray-600">
                        {formatPrice(order.prix)}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.financialStatus)}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Détails de la commande sélectionnée */}
        <div>
          {selectedOrder ? (
            <FinancialOrderManager
              order={selectedOrder}
              onOrderUpdate={handleOrderUpdate}
              allProducts={selectedOrder.products || []}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Sélectionnez une commande pour voir les détails financiers
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Erreur:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default FinancialManagementPage;