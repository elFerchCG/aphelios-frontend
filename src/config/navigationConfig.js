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

export const navigationConfig = [
  {
    label: "Inicio",
    icon: HomeOutlinedIcon,
    path: "/home",
  },
  {
    label: "Plan de Trabajo",
    icon: TaskAltOutlinedIcon,
    path: "/planTrabajo",
    roles: ["administrador"],
  },
  {
    label: "Envíos",
    icon: LocalShippingOutlinedIcon,
    path: "/envios",
    excludeRoles: ["Marketing", "Coordinador Comercial", "Lider Marketing"],
  },
  {
    label: "Publicaciones",
    icon: StorefrontOutlinedIcon,
    children: [
      {
        label: "Componentes",
        icon: CategoryOutlinedIcon,
        path: "/componentes",
        roles: ["administrador", "Planeador"],
      },
      {
        label: "Billetes",
        icon: AccountTreeOutlinedIcon,
        path: "/billetes",
        roles: ["administrador", "Planeador"],
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
        roles: ["administrador", "Almacenista"],
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
        label: "Excedentes",
        icon: MoveToInboxOutlinedIcon,
        path: "/nuevos-excedentes",
        roles: ["administrador", "Planeador", "Almacenista"],
      },
      {
        label: "Stock Componentes",
        icon: CategoryOutlinedIcon,
        path: "/stock-componentes",
        roles: ["administrador", "Planeador", "Almacenista"],
      },
    ],
  },
  {
    label: "MRP",
    icon: PrecisionManufacturingOutlinedIcon,
    roles: ["administrador", "Planeador"],
    children: [
      {
        label: "MRP manual",
        icon: PrecisionManufacturingOutlinedIcon,
        path: "/mrp",
        roles: ["administrador", "Planeador"],
      },
      {
        label: "Procesos",
        icon: SettingsSuggestOutlinedIcon,
        path: "/procesos",
        roles: ["administrador", "Planeador"],
      },
    ],
  },
  {
    label: "Compras",
    icon: ShoppingCartOutlinedIcon,
    roles: ["administrador"],
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
        roles: ["administrador", "Lider Marketing", "Coordinador comercial"],
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
    roles: ["administrador"],
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
    label: "Configuración",
    icon: SettingsOutlinedIcon,
    roles: ["administrador", "Planeador", "Almacenista"],
    children: [
      {
        label: "Tipos de Movimientos",
        icon: SyncAltOutlinedIcon,
        path: "/transacciones",
        roles: ["administrador", "Planeador", "Almacenista"],
      },
      {
        label: "Usuarios",
        icon: GroupsOutlinedIcon,
        path: "/usuarios",
        roles: ["administrador", "Planeador"],
      },
      {
        label: "Proveedores",
        icon: LocalShippingIcon,
        path: "/proveedores",
        roles: ["administrador", "Planeador"],
      },
      {
        label: "Bodegas",
        icon: WarehouseOutlinedIcon,
        path: "/bodegas",
        roles: ["administrador", "Planeador", "Almacenista"],
      },
      {
        label: "Órdenes retiro",
        icon: ExitToAppOutlinedIcon,
        path: "/ordenes-retiro",
        roles: ["administrador", "Planeador"],
      },
    ],
  },
];
