<?php

namespace Tests\Feature;

use App\Models\Sponsor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserSponsorApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_only_active_sponsors(): void
    {
        $this->withoutMiddleware();

        $activeSponsor = Sponsor::factory()->create(['is_active' => true]);
        $inactiveSponsor = Sponsor::factory()->create(['is_active' => false]);

        $response = $this->getJson('/api/user/sponsors');

        $response->assertOk()
            ->assertJsonFragment([
                'id' => $activeSponsor->id,
                'title' => $activeSponsor->title,
            ])
            ->assertJsonMissing(['id' => $inactiveSponsor->id]);
    }
}
