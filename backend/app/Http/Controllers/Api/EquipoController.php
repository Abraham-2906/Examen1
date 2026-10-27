<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuardarEquipoRequest;
use App\Http\Resources\EquipoResource;
use App\Models\Equipo;
use App\Services\EquipoService;
use Illuminate\Http\Request;

class EquipoController extends Controller
{
    public function __construct(private EquipoService $service)
    {
    }

    public function index(Request $request)
    {
        $porPagina = (int) $request->input('per_page', 10);
        $porPagina = $porPagina > 0 ? min($porPagina, 50) : 10;

        $equipos = $this->service->listar(
            $request->input('q'),
            $request->input('estado'),
            $porPagina
        );

        return EquipoResource::collection($equipos);
    }

    public function show(Equipo $equipo)
    {
        return new EquipoResource($equipo->load('categoria'));
    }

    public function store(GuardarEquipoRequest $request)
    {
        $equipo = $this->service->crear($request->validated());

        return (new EquipoResource($equipo))
            ->response()
            ->header('Location', url("/api/equipos/{$equipo->id}"))
            ->setStatusCode(201);
    }

    public function update(GuardarEquipoRequest $request, Equipo $equipo)
    {
        $actualizado = $this->service->actualizar($equipo, $request->validated());

        return new EquipoResource($actualizado);
    }

    public function destroy(Equipo $equipo)
    {
        $this->service->eliminar($equipo);

        return response()->noContent();
    }

    public function prestar(Equipo $equipo)
    {
        $prestado = $this->service->prestar($equipo);

        return new EquipoResource($prestado);
    }
}
