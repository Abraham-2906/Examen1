<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::first() ?? Categoria::create(['nombre' => 'Cómputo']);

    $datos = [
        'codigo'            => 'EQ-9999',
        'nombre'            => 'Laptop Lenovo ThinkPad',
        'categoria_id'      => $categoria->id,
        'estado'            => 'disponible',
        'fecha_adquisicion' => '2026-01-15',
        'costo_interno'     => 1200.50,
    ];

    $response = $this->postJson('/api/equipos', $datos);

    $response->assertStatus(201)
        ->assertHeader('Location', url("/api/equipos/{$response->json('data.id')}"));

    $this->assertDatabaseHas('equipos', [
        'codigo' => 'EQ-9999',
    ]);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $response = $this->postJson('/api/equipos', [
        'codigo'            => 'INVALIDO',
        'nombre'            => 'ab',
        'categoria_id'      => 99999,
        'estado'            => 'prestado',
        'fecha_adquisicion' => '2099-01-01',
        'costo_interno'     => -25,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors([
            'codigo',
            'nombre',
            'categoria_id',
            'estado',
            'fecha_adquisicion',
            'costo_interno',
        ]);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $categoria = Categoria::first() ?? Categoria::create(['nombre' => 'Cómputo']);

    $equipo = Equipo::create([
        'codigo'            => 'EQ-8888',
        'nombre'            => 'Equipo en Préstamo Test',
        'categoria_id'      => $categoria->id,
        'estado'            => 'prestado',
        'fecha_adquisicion' => '2026-01-10',
        'costo_interno'     => 800,
    ]);

    $response = $this->deleteJson("/api/equipos/{$equipo->id}");

    $response->assertStatus(409)
        ->assertJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo'  => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', [
        'id' => $equipo->id,
    ]);
});