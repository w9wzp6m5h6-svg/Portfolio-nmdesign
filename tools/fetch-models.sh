#!/usr/bin/env bash
# Downloads the source 3D assets used by the offline render rig (tools/render).
# Source: Khronos glTF-Sample-Assets — licenses listed in CREDITS.md.
set -euo pipefail
cd "$(dirname "$0")/render/models"
BASE=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models
for m in MaterialsVariantsShoe CarConcept ChronographWatch SheenWoodLeatherSofa SheenChair SunglassesKhronos IridescenceLamp SpecularSilkPouf; do
  [ -f "$m.glb" ] || curl -sSfo "$m.glb" "$BASE/$m/glTF-Binary/$m.glb"
  echo "ok  $m"
done
