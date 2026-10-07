import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import MoveToInboxOutlinedIcon from "@mui/icons-material/MoveToInboxOutlined";

import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import SettingsSuggestOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";

import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import ScoreOutlinedIcon from "@mui/icons-material/ScoreOutlined";

import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import NewReleasesOutlinedIcon from "@mui/icons-material/NewReleasesOutlined";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";

import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";

// [MULTICUENTA-ML]
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
// [/MULTICUENTA-ML]

export const navigationConfig = [
  {
    label: "Inicio",
    icon: HomeOutlinedIcon,
    path: "/home",
  },
  {
    label: "Productos de aphelios",
    icon: Inventory2OutlinedIcon,
    path: "/productosAphelios",
    roles: ["administrador", "Desarrollador"],
  },
  {
    label: "Plan de Trabajo",
    icon: TaskAltOutlinedIcon,
    path: "/planTrabajo",
    roles: ["administrador", "Desarrollador"],
  },
  {
    label: "Envíos",
    icon: LocalShippingOutlinedIcon,
    path: "/envios",
    excludeRoles: ["Marketing", "Coordinador Comercial", "Lider Marketing", "Desarrollador"],
  },
  {
    label: "Publicaciones",
    icon: StorefrontOutlinedIcon,
    children: [
      {
        label: "Componentes",
        icon: CategoryOutlinedIcon,
        path: "/componentes",
        roles: ["administrador", "Planeador", "Marketing", "Desarrollador"],
      },
      {
        label: "Billetes",
        icon: AccountTreeOutlinedIcon,
        path: "/billetes",
        roles: ["administrador", "Planeador", "Marketing", "Desarrollador"],
      },
      {
        label: "Publicaciones",
        icon: StorefrontOutlinedIcon,
        path: "/publicaciones",
      },
    ],
  },
  {
    label: "Inventario",
    icon: Inventory2OutlinedIcon,
    children: [
      {
        label: "Órdenes",
        icon: AssignmentOutlinedIcon,
        path: "/ordenes",
      },
      {
        label: "Conteo Cíclico",
        icon: ChecklistOutlinedIcon,
        path: "/conteociclico",
        roles: ["administrador", "Almacenista", "Desarrollador"],
      },
      {
        label: "Transacciones",
        icon: SwapHorizOutlinedIcon,
        path: "/transaccionesInventario",
      },
      {
        label: "Existencias",
        icon: InventoryOutlinedIcon,
        path: "/existencias",
      },
      {
        label: "Recepción de pedidos",
        icon: AssignmentTurnedInOutlinedIcon,
        path: "/recepcion-pedidos",
        roles: ["administrador", "Planeador", "Almacenista"],
      },
      {
        label: "Excedentes",
        icon: MoveToInboxOutlinedIcon,
        path: "/nuevos-excedentes",
        roles: ["administrador", "Planeador", "Almacenista", "Desarrollador"],
      },
      {
        label: "Stock Componentes",
        icon: CategoryOutlinedIcon,
        path: "/stock-componentes",
        roles: ["administrador", "Planeador", "Almacenista", "Desarrollador"],
      },
      // [MULTICUENTA-ML]
      {
        label: "Colecta subcuenta",
        icon: AssignmentReturnOutlinedIcon,
        path: "/colecta-subcuenta",
        roles: ["administrador", "Planeador", "Almacenista"],
      },
      // [/MULTICUENTA-ML]
    ],
  },
  {
    label: "MRP",
    icon: PrecisionManufacturingOutlinedIcon,
    roles: ["administrador", "Planeador", "Desarrollador"],
    children: [
      {
        label: "MRP manual",
        icon: PrecisionManufacturingOutlinedIcon,
        path: "/mrp",
        roles: ["administrador", "Planeador", "Desarrollador"],
      },
      {
        label: "Órdenes de retiro",
        icon: ExitToAppOutlinedIcon,
        path: "/ordenes-retiro",
        roles: ["administrador", "Planeador"],
      },
      {
        label: "Procesos",
        icon: SettingsSuggestOutlinedIcon,
        path: "/procesos",
        roles: ["administrador", "Planeador", "Desarrollador"],
      },
    ],
  },
  {
    label: "Compras",
    icon: ShoppingCartOutlinedIcon,
    roles: ["administrador", "Desarrollador"],
    children: [
      {
        label: "Pedidos",
        icon: AssignmentOutlinedIcon,
        path: "/pedidos",
      },
      {
        label: "Cargar Facturas",
        icon: UploadFileOutlinedIcon,
        path: "/cargaFacturas",
      },
      {
        label: "Ver Facturas",
        icon: ReceiptLongOutlinedIcon,
        path: "/facturas",
      },
    ],
  },
  {
    label: "Marketing",
    icon: CampaignOutlinedIcon,
    roles: [
      "administrador",
      "Marketing",
      "Coordinador comercial",
      "Lider Marketing",
      "Planeador",
      "Desarrollador",
    ],
    children: [
      {
        label: "Preguntas",
        icon: HelpOutlineOutlinedIcon,
        path: "/preguntas",
        roles: [
          "administrador",
          "Planeador",
          "Marketing",
          "Coordinador comercial",
          "Lider Marketing",
          "Desarrollador",
        ],
      },
      {
        label: "Productos nuevos",
        icon: NewReleasesOutlinedIcon,
        path: "/nuevos-productos",
        roles: [
          "administrador",
          "Planeador",
          "Marketing",
          "Coordinador comercial",
          "Lider Marketing",
          "Desarrollador"
        ],
      },

      {
        label: "Kaizen",
        icon: TrendingUpOutlinedIcon,
        children: [
          {
            label: "Resumen",
            icon: DashboardOutlinedIcon,
            path: "/marketing",
          },
          {
            label: "Kaizen Ventas",
            icon: TrendingUpOutlinedIcon,
            path: "/kaizenVentasPerdidas",
          },
          {
            label: "Kaizen Seguimiento",
            icon: ManageSearchOutlinedIcon,
            path: "/kaizenSeguimiento",
          },
        ],
      },

      {
        label: "Performance Comercial",
        icon: QueryStatsOutlinedIcon,
        path: "/performanceComercial",
        roles: ["administrador", "Lider Marketing", "Coordinador comercial", "Desarrollador"],
      },
      {
        label: "Bitácora de Publicaciones",
        icon: DescriptionOutlinedIcon,
        path: "/publicacionesMejoras",
      },
    ],
  },
  {
    label: "Gráficas",
    icon: InsertChartOutlinedIcon,
    roles: ["administrador", "Desarrollador"],
    children: [
      {
        label: "Ventas",
        icon: BarChartOutlinedIcon,
        path: "/analisisVentas",
      },
      {
        label: "Pronóstico",
        icon: ShowChartOutlinedIcon,
        path: "/chartpronostico",
      },
      {
        label: "Score Card",
        icon: ScoreOutlinedIcon,
        path: "/graficas",
      },
    ],
  },
  {
    label: "Soporte",
    icon: SupportAgentOutlinedIcon,
    children: [
      {
        label: "Mis Tickets",
        icon: ConfirmationNumberOutlinedIcon,
        path: "/soporte",
      },
      {
        label: "Bandeja de Soporte",
        icon: SupportAgentOutlinedIcon,
        path: "/soporte/bandeja",
        roles: ["Desarrollador"],
      },
      {
        label: "Métricas",
        icon: AnalyticsOutlinedIcon,
        path: "/soporte/metricas",
        roles: ["administrador", "Desarrollador"],
      },
    ],
  },
  {
    label: "Configuración",
    icon: SettingsOutlinedIcon,
    roles: ["administrador", "Planeador", "Almacenista", "Desarrollador"],
    children: [
      {
        label: "Avisos",
        icon: NotificationsActiveOutlinedIcon,
        path: "/avisos",
        roles: ["administrador", "Desarrollador"],
      },
      {
        label: "Cuentas Ecommerce",
        icon: StorefrontOutlinedIcon,
        path: "/cuentasEcommerce",
        roles: ["administrador", "Desarrollador"],
      },
      // [MULTICUENTA-ML]
      {
        label: "Stock compartido",
        icon: CloudSyncOutlinedIcon,
        path: "/stock-compartido",
        roles: ["administrador"],
      },
      // [/MULTICUENTA-ML]
      {
        label: "Tipos de Movimientos",
        icon: SyncAltOutlinedIcon,
        path: "/transacciones",
        roles: ["administrador", "Planeador", "Almacenista", "Desarrollador"],
      },
      {
        label: "Usuarios",
        icon: GroupsOutlinedIcon,
        path: "/usuarios",
        roles: ["administrador", "Planeador", "Desarrollador"],
      },
      {
        label: "Proveedores",
        icon: LocalShippingIcon,
        path: "/proveedores",
        roles: ["administrador", "Planeador", "Desarrollador"],
      },
      {
        label: "Bodegas",
        icon: WarehouseOutlinedIcon,
        path: "/bodegas",
        roles: ["administrador", "Planeador", "Almacenista", "Desarrollador"],
      },
    ],
  },
];
